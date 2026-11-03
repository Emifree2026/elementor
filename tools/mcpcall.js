// Minimal MCP-over-HTTP JSON-RPC client for the Elementor MCP endpoint.
// Keeps one session alive across calls within a process; callers pass
// the tool name and (optionally) raw JSON args.
//
// The URL and Authorization header are read from the user config rather than
// hardcoded, so a typo in this file cannot silently produce a 401 that looks
// like a missing MCP session.
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync(process.env.USERPROFILE + '/.claude.json', 'utf8'));
const server = cfg.mcpServers['landing_wp_test-elementor'];
const URL = server.url;
const AUTH = server.headers.Authorization;

let sessionId = null;
let rpcId = 0;

async function rpc(method, params) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'Authorization': AUTH,
  };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;

  const body = { jsonrpc: '2.0', method };
  if (params !== undefined) body.params = params;
  if (method !== 'notifications/initialized') body.id = ++rpcId;

  const res = await fetch(URL, { method: 'POST', headers, body: JSON.stringify(body) });

  const sid = res.headers.get('mcp-session-id');
  if (sid) sessionId = sid;

  const text = await res.text();
  if (!text.trim()) return { _raw: null, status: res.status };

  // The endpoint may answer as application/json or as an SSE frame.
  if (res.headers.get('content-type')?.includes('text/event-stream')) {
    const dataLine = text.split('\n').find(l => l.startsWith('data:'));
    if (!dataLine) return { _raw: text, status: res.status };
    return { ...JSON.parse(dataLine.slice(5).trim()), _status: res.status };
  }
  try { return { ...JSON.parse(text), _status: res.status }; }
  catch { return { _raw: text, status: res.status }; }
}

async function init() {
  const r = await rpc('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'claude-code-manual', version: '1.0.0' },
  });
  await rpc('notifications/initialized');
  return { sessionId, serverInfo: r.result?.serverInfo ?? r.serverInfo ?? null };
}

async function callTool(name, args) {
  return rpc('tools/call', { name, arguments: args });
}

async function listTools() {
  const r = await rpc('tools/list', {});
  return r.result?.tools ?? [];
}

module.exports = { init, callTool, listTools, rpc, getSession: () => sessionId };

if (require.main === module) {
  (async () => {
    // argv[2] is the subcommand or the tool name; argv[3] is the extra
    // argument for 'schema', or the JSON args for a tool call.
    const first = process.argv[2];
    const info = await init();
    console.error('session:', info.sessionId);
    if (first === 'list') {
      const tools = await listTools();
      console.log(JSON.stringify(tools.map(t => ({ name: t.name, desc: (t.description||'').slice(0,70) })), null, 1));
    } else if (first === 'schema') {
      const tools = await listTools();
      const t = tools.find(x => x.name === process.argv[3]);
      console.log(JSON.stringify(t, null, 1));
    } else {
      const args = JSON.parse(process.argv[3] || '{}');
      const r = await callTool(first, args);
      const c = r.result?.content ?? [];
      c.forEach(b => { if (b.type === 'text') console.log(b.text); });
      if (!c.length) console.log(JSON.stringify(r, null, 1));
    }
  })().catch(e => { console.error('FATAL', e.message); process.exit(1); });
}
