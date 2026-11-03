/**
 * Generate the dedicated ed25519 key for the Emifree2026/elementor repository
 * and write it in OpenSSH format.
 *
 *   node make-openssh-key.mjs
 *
 * Writes:
 *   ~/.ssh/id_ed25519_elementor        private key, openssh-key-v1 (unencrypted)
 *   ~/.ssh/id_ed25519_elementor.pub    public key, "ssh-ed25519 AAAA... comment"
 *
 * The public key file is also copied to the clipboard as a single line, ready
 * to paste into GitHub > Settings > Deploy keys > Add deploy key.
 *
 * Format reference: PROTOCOL.key (OpenSSH), "openssh-key-v1" container with
 * ciphername "none" / kdfname "none" (unencrypted).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SSH_DIR = path.join(os.homedir(), '.ssh');
const KEY_PATH = path.join(SSH_DIR, 'id_ed25519_elementor');
const PUB_PATH = `${KEY_PATH}.pub`;
const COMMENT = 'vpedr@emifree-elementor';

// --- SSH wire primitives ----------------------------------------------------

/** uint32 big-endian length prefix. */
function u32(n) {
	const b = Buffer.alloc(4);
	b.writeUInt32BE(n, 0);
	return b;
}

/** SSH "string": uint32 length + raw bytes. */
function sshString(buf) {
	return Buffer.concat([u32(buf.length), buf]);
}

// --- keypair -----------------------------------------------------------------

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

// The JWK export gives the raw 32-byte seed and the raw 32-byte public key.
const jwk = privateKey.export({ format: 'jwk' });
const seed = Buffer.from(jwk.d, 'base64url'); // 32 bytes
const pub = Buffer.from(jwk.x, 'base64url'); //  32 bytes

if (seed.length !== 32 || pub.length !== 32) {
	throw new Error(`unexpected key sizes: seed=${seed.length} pub=${pub.length}`);
}

// --- public key line ---------------------------------------------------------

// "ssh-ed25519" + base64( string("ssh-ed25519") + string(pub) )
const pubBlob = Buffer.concat([
	sshString(Buffer.from('ssh-ed25519')),
	sshString(pub),
]);
const pubLine = `ssh-ed25519 ${pubBlob.toString('base64')} ${COMMENT}\n`;

// --- private key (openssh-key-v1, unencrypted) --------------------------------

// The private section: two identical check ints, then keytype, pub, priv
// (seed || pub), comment, and padding bytes 1..n to the cipher block size.
const check = crypto.randomBytes(4);
const privSection = Buffer.concat([
	check,
	check,
	sshString(Buffer.from('ssh-ed25519')),
	sshString(pub),
	sshString(Buffer.concat([seed, pub])),
	sshString(Buffer.from(COMMENT)),
]);

// Padding: bytes 1,2,3,... so the section length is a multiple of 8.
const padLen = (8 - (privSection.length % 8)) % 8;
const padding = Buffer.from(Array.from({ length: padLen }, (_, i) => i + 1));

const magic = Buffer.from('openssh-key-v1\0', 'binary');

const blob = Buffer.concat([
	magic,
	sshString(Buffer.from('none')), // ciphername
	sshString(Buffer.from('none')), // kdfname
	sshString(Buffer.from('')), // kdfoptions
	u32(1), // number of keys
	sshString(pubBlob), // publickey1
	sshString(Buffer.concat([privSection, padding])), // encrypted section
]);

// PEM-armour it the way OpenSSH does.
const b64 = blob.toString('base64');
const lines = b64.match(/.{1,70}/g) ?? [];
const pem =
	'-----BEGIN OPENSSH PRIVATE KEY-----\n' +
	lines.join('\n') +
	'\n-----END OPENSSH PRIVATE KEY-----\n';

// --- write -------------------------------------------------------------------

fs.mkdirSync(SSH_DIR, { recursive: true });

for (const p of [KEY_PATH, PUB_PATH]) {
	if (fs.existsSync(p)) {
		fs.renameSync(p, `${p}.bak-${Date.now()}`);
		console.log(`backed up existing ${p}`);
	}
}

fs.writeFileSync(KEY_PATH, pem, { mode: 0o600 });
fs.writeFileSync(PUB_PATH, pubLine, { mode: 0o644 });

console.log(`private key -> ${KEY_PATH}`);
console.log(`public key  -> ${PUB_PATH}`);
console.log('');
console.log('=== public key (one line, paste this into GitHub) ===');
console.log(pubLine.trim());
console.log('======================================================');
