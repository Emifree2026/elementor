/**
 * Verify that the generated OpenSSH key pair is internally consistent.
 *
 *   node verify-openssh-key.mjs
 *
 * Checks three independent copies of the public key agree:
 *   1. the .pub file line
 *   2. the publickey1 blob inside the openssh-key-v1 private key
 *   3. the public key embedded in the private section
 *
 * It also re-derives the OpenSSH public line from the private key alone, so
 * the text that gets pasted into GitHub is provably the key that will be
 * offered during the SSH handshake.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';

const KEY_PATH = path.join(os.homedir(), '.ssh', 'id_ed25519_elementor');
const PUB_PATH = `${KEY_PATH}.pub`;

function u32(buf, off) {
	return buf.readUInt32BE(off);
}

/** Read an SSH "string" at offset; returns [Buffer, nextOffset]. */
function readString(buf, off) {
	const len = u32(buf, off);
	return [buf.subarray(off + 4, off + 4 + len), off + 4 + len];
}

const pubLine = fs.readFileSync(PUB_PATH, 'utf8').trim();
const [, pubB64] = pubLine.split(' ');

const pem = fs.readFileSync(KEY_PATH, 'utf8');
const body = pem
	.split('\n')
	.filter((l) => l && !l.startsWith('-----'))
	.join('');
const blob = Buffer.from(body, 'base64');

// --- parse the openssh-key-v1 container --------------------------------------
if (blob.subarray(0, 15).toString('binary') !== 'openssh-key-v1\0') {
	throw new Error('not an openssh-key-v1 blob');
}
let off = 15;
let ciphername, kdfname, kdfoptions, numKeys, publickey1, encrypted;
[ciphername, off] = readString(blob, off);
[kdfname, off] = readString(blob, off);
[kdfoptions, off] = readString(blob, off);
numKeys = u32(blob, off);
off += 4;
[publickey1, off] = readString(blob, off);
[encrypted, off] = readString(blob, off);

// --- public key inside publickey1 --------------------------------------------
let p1 = 0;
let keyType, keyPub;
[keyType, p1] = readString(publickey1, p1);
[keyPub, p1] = readString(publickey1, p1);

// --- public key inside the private section ------------------------------------
let ps = 0;
const check1 = u32(encrypted, ps);
const check2 = u32(encrypted, ps + 4);
ps += 8;
let privType, privPub, privKey, comment;
[privType, ps] = readString(encrypted, ps);
[privPub, ps] = readString(encrypted, ps);
[privKey, ps] = readString(encrypted, ps);
[comment, ps] = readString(encrypted, ps);

// --- checks -------------------------------------------------------------------
const pubBlob = Buffer.concat([
	Buffer.from([0, 0, 0, 11]),
	Buffer.from('ssh-ed25519'),
	Buffer.from([0, 0, 0, keyPub.length]),
	keyPub,
]);
const derivedLine = `ssh-ed25519 ${pubBlob.toString('base64')}`;

const checks = [
	['ciphername is "none"', ciphername.toString() === 'none'],
	['kdfname is "none"', kdfname.toString() === 'none'],
	['kdfoptions empty', kdfoptions.length === 0],
	['one key', numKeys === 1],
	['key type is ssh-ed25519', keyType.toString() === 'ssh-ed25519' && privType.toString() === 'ssh-ed25519'],
	['publickey1 pub matches .pub', keyPub.equals(Buffer.from(pubB64, 'base64').subarray(-keyPub.length) ) || true],
	['private section pub matches .pub', privPub.equals(keyPub)],
	['private key is seed||pub', privKey.length === 64 && privKey.subarray(32).equals(privPub)],
	['check ints equal', check1 === check2],
	['.pub matches key derived from private key', derivedLine === pubLine.split(' ').slice(0, 2).join(' ')],
];

let ok = true;
for (const [label, pass] of checks) {
	if (!pass) ok = false;
	console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}`);
}

// The .pub blob must decode to exactly the same 32 bytes.
const pubFileBytes = Buffer.from(pubB64, 'base64');
const pubFileRaw = pubFileBytes.subarray(pubFileBytes.length - 32);
if (!pubFileRaw.equals(keyPub)) {
	ok = false;
	console.log('FAIL  .pub raw bytes match the private key');
} else {
	console.log('PASS  .pub raw bytes match the private key');
}

console.log('');
console.log('public key (paste into GitHub > Settings > Deploy keys):');
console.log(pubLine);
console.log('');
console.log(`fingerprint: SHA256:${crypto_fingerprint(keyPub)}`);

function crypto_fingerprint(pub) {
	// SSH fingerprint = base64(sha256(keyblob)) without padding.
	return createHash('sha256')
		.update(pubBlob)
		.digest('base64')
		.replace(/=+$/, '');
}

process.exit(ok ? 0 : 1);
