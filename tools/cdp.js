#!/usr/bin/env node
'use strict';
/*
 * Chrome DevTools Protocol driver -- no npm dependencies (Node 22+ has a
 * global WebSocket).
 *
 * Why this exists: the Elementor preview page is several viewports tall, and
 * `chrome --screenshot` with a #fragment scrolls unreliably (it lands on a
 * blank band). Driving CDP lets us:
 *   - set the exact viewport (device metrics) per breakpoint,
 *   - wait for images/fonts to settle,
 *   - measure a section's real bounding box,
 *   - screenshot exactly that box.
 *
 * Usage:
 *   node cdp.js <url> <width> <height> <selector> <out.png> [dpr]
 *
 * selector may be a CSS selector or the literal string "full" (whole page).
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error('CDP endpoint never came up: ' + url);
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener('message', (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch (e) {
        return;
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message + ' ' + JSON.stringify(msg.error.data || '')));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('CDP timeout: ' + method));
        }
      }, 60000);
    });
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) {
      throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails.exception));
    }
    return r.result.value;
  }
}

async function main() {
  const [url, width, height, selector, out, dprArg] = process.argv.slice(2);
  if (!url || !width || !height || !selector || !out) {
    console.error('usage: node cdp.js <url> <width> <height> <selector|full> <out.png> [dpr]');
    process.exit(1);
  }
  const dpr = Number(dprArg || 1);

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-prof-'));
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { stdio: 'ignore', detached: false }
  );

  let cdp;
  try {
    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const page = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    cdp = new Cdp(ws);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: Number(width),
      height: Number(height),
      deviceScaleFactor: dpr,
      mobile: Number(width) < 768,
    });

    await cdp.send('Page.navigate', { url });
    // Wait for load.
    for (let i = 0; i < 80; i++) {
      const state = await cdp.eval('document.readyState');
      if (state === 'complete') break;
      await sleep(250);
    }
    // Let lazy images decode and fonts settle.
    await cdp.eval(`
      (async () => {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 400));
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 200));
        if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch(e) {} }
        await new Promise(r => setTimeout(r, 300));
        return true;
      })()
    `);

    // Dismiss the cookie-consent overlay. It is injected client-side and is
    // position:fixed, so it would otherwise cover the top of the viewport and
    // hide the section heading in every screenshot. The browser runs on a
    // throwaway profile, so accepting here does not touch the site.
    await cdp.eval(`
      (async () => {
        const btn = [...document.querySelectorAll('button, a')]
          .find(b => /accept all/i.test((b.textContent || '').trim()));
        if (btn) {
          btn.click();
          await new Promise(r => setTimeout(r, 800));
        }
        // Some consent plugins leave a floating launcher button behind, which
        // renders on top of the captured region. Remove the whole widget.
        for (const sel of ['#stcm-wrapper', '#stcm-banner', '#stcm-cta', '.stcm-pos-bottom-left', '[id^="stcm"]']) {
          for (const el of document.querySelectorAll(sel)) el.remove();
        }
        await new Promise(r => setTimeout(r, 200));
        return 'dismissed';
      })()
    `);

    let clip = null;
    if (selector !== 'full') {
      const box = await cdp.eval(`
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return null;
          el.scrollIntoView({block: 'start'});
          const r = el.getBoundingClientRect();
          return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
        })()
      `);
      if (!box) {
        console.error('selector not found:', selector);
        process.exit(2);
      }
      await sleep(300);
      const box2 = await cdp.eval(`
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          const r = el.getBoundingClientRect();
          return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
        })()
      `);
      clip = {
        x: Math.max(0, box2.x),
        y: Math.max(0, box2.y),
        width: Math.ceil(box2.w),
        height: Math.ceil(Math.min(box2.h, 12000)),
        scale: 1,
      };
      console.log('element box:', JSON.stringify(box2));
    }

    // Wait for every image to finish loading. This runs AFTER the element has
    // been scrolled into view, because a `loading="lazy"` image only starts
    // fetching once it is near the viewport - checking earlier leaves empty
    // image frames in the screenshot.
    await cdp.eval(`
      (async () => {
        const t0 = Date.now();
        while (Date.now() - t0 < 15000) {
          const imgs = [...document.images];
          if (imgs.every(im => im.complete && im.naturalWidth > 0)) return 'all loaded';
          await new Promise(r => setTimeout(r, 250));
        }
        return 'timeout';
      })()
    `);

    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      ...(clip ? { clip } : {}),
    });
    fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
    console.log('ok', out, fs.statSync(out).size, 'bytes');
  } finally {
    try {
      chrome.kill();
    } catch (e) {
      /* ignore */
    }
    try {
      fs.rmSync(profile, { recursive: true, force: true });
    } catch (e) {
      /* ignore */
    }
  }
}

main().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
