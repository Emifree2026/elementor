/**
 * Audit the repository for leaked secrets — across the working tree AND every
 * object in the git history.
 *
 *   node audit-secrets.mjs
 *
 * Checks for:
 *   - the MCP Authorization token (read from ~/.claude.json, never printed)
 *   - the base64 body of the new SSH private key
 *   - any file whose name looks like key material
 *
 * Prints only match counts and file names. Secret values are never written to
 * stdout, stderr, or the transcript.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO = 'C:/Users/vpedr/Projects/emifree-elementor';

const git = (args) =>
	execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// --- collect the secret values ------------------------------------------------
const secrets = [];

// 1. MCP server token(s).
const claudeCfgPath = path.join(os.homedir(), '.claude.json');
if (fs.existsSync(claudeCfgPath)) {
	try {
		const cfg = JSON.parse(fs.readFileSync(claudeCfgPath, 'utf8'));
		for (const [name, server] of Object.entries(cfg.mcpServers ?? {})) {
			for (const header of Object.values(server.headers ?? {})) {
				const value = String(header).replace(/^Bearer\s+/i, '').trim();
				if (value.length >= 12) secrets.push({ label: `mcp:${name} authorization`, value });
			}
		}
	} catch {
		/* unreadable config is not a finding */
	}
}

// 2. The dedicated SSH private key body (the PEM base64 blob).
const keyPath = path.join(os.homedir(), '.ssh', 'id_ed25519_elementor');
if (fs.existsSync(keyPath)) {
	const pem = fs.readFileSync(keyPath, 'utf8');
	const body = pem
		.split('\n')
		.filter((l) => l && !l.startsWith('-----'))
		.join('');
	if (body.length > 40) secrets.push({ label: 'ssh private key body', value: body });
	// Also the base64 of just the first armoured line group, in case it was
	// split across lines somewhere.
	const firstChunk = body.slice(0, 120);
	if (firstChunk.length >= 40) secrets.push({ label: 'ssh private key (head)', value: firstChunk });
}

// --- scan every blob in the repository history ---------------------------------
const objectList = git(['rev-list', '--all', '--objects']).split('\n').filter(Boolean);

const byObject = new Map();
for (const line of objectList) {
	const [sha, ...rest] = line.split(' ');
	if (!rest.length) continue;
	const name = rest.join(' ');
	byObject.set(sha, name);
}

const findings = [];
let scanned = 0;

for (const [sha, name] of byObject) {
	let type;
	try {
		type = git(['cat-file', '-t', sha]).trim();
	} catch {
		continue;
	}
	if (type !== 'blob') continue;

	const content = git(['cat-file', 'blob', sha]);
	scanned += 1;

	for (const secret of secrets) {
		if (content.includes(secret.value)) {
			findings.push({ name, label: secret.label, sha: sha.slice(0, 10) });
		}
	}
}

// --- scan the working tree for key-like filenames ------------------------------
const tracked = git(['ls-files']).split('\n').filter(Boolean);
const keyLike = tracked.filter((f) =>
	/(^|[\\/])\.ssh([\\/]|$)|id_(rsa|ed25519|ecdsa|dsa)\b|\.pem$|\.p12$|\.pfx$|id_rsa|known_hosts|\.key$/i.test(f)
);

// --- scan the working tree for credential-looking assignments ------------------
const assignPattern =
	/\b(?:authorization|bearer|password|passwd|secret|api[_-]?key|access[_-]?token|client[_-]?secret)\b\s*[:=]\s*['"][^'"]{8,}['"]/gi;

const worktreeFindings = [];
for (const file of tracked) {
	const abs = path.join(REPO, file);
	if (!fs.existsSync(abs)) continue;
	let text;
	try {
		text = fs.readFileSync(abs, 'utf8');
	} catch {
		continue;
	}
	if (!text.includes('\0')) {
		const hits = text.match(assignPattern);
		if (hits) {
			// Report the matched KEY NAME only, never the value.
			worktreeFindings.push({ file, keys: hits.map((h) => h.split(/[:=]/)[0].trim()) });
		}
	}
}

// --- report -------------------------------------------------------------------
console.log(`secrets checked : ${secrets.length}`);
console.log(`blobs scanned   : ${scanned} (all history)`);
console.log(`tracked files   : ${tracked.length}`);
console.log('');

console.log(`history matches : ${findings.length}`);
for (const f of findings) console.log(`  LEAK  ${f.name}  (${f.label}, blob ${f.sha})`);

console.log(`key-like files  : ${keyLike.length}`);
for (const f of keyLike) console.log(`  LEAK  ${f}`);

console.log(`literal assignments in tree : ${worktreeFindings.length}`);
for (const f of worktreeFindings) console.log(`  REVIEW ${f.file}  -> ${f.keys.join(', ')}`);

const leaks = findings.length + keyLike.length;
console.log('');
console.log(leaks === 0 ? 'PASS  no secret material in the repository or its history' : `FAIL  ${leaks} secret leak(s)`);
process.exit(leaks === 0 ? 0 : 1);
