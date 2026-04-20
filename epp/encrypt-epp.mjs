// encrypt-epp.mjs — Encrypts the protected content of the EPP page
// Usage: node encrypt-epp.mjs

import { readFileSync, writeFileSync } from 'fs';
import { webcrypto } from 'crypto';
const subtle = webcrypto.subtle;

const PASSWORD = 'epp';
const INPUT = new URL('./index.html', import.meta.url).pathname;

async function encrypt() {
  const html = readFileSync(INPUT, 'utf-8');

  // Extract protected content: everything between the two markers
  const startMarker = '<!-- PROTECTED_START -->';
  const endMarker = '<!-- PROTECTED_END -->';
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    console.error('Markers not found in index.html. Add <!-- PROTECTED_START --> and <!-- PROTECTED_END --> markers.');
    process.exit(1);
  }

  const protectedContent = html.substring(startIdx + startMarker.length, endIdx);

  // Encrypt with AES-GCM
  const salt = new Uint8Array(16);
  webcrypto.getRandomValues(salt);
  const iv = new Uint8Array(12);
  webcrypto.getRandomValues(iv);

  const keyMaterial = await subtle.importKey(
    'raw',
    new TextEncoder().encode(PASSWORD),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encrypted = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(protectedContent)
  );

  // Encode as base64
  const toB64 = buf => Buffer.from(buf).toString('base64');
  const payload = JSON.stringify({
    salt: toB64(salt),
    iv: toB64(iv),
    data: toB64(encrypted)
  });

  // Build the new HTML: everything before PROTECTED_START + encrypted blob + everything after PROTECTED_END
  const before = html.substring(0, startIdx);
  const after = html.substring(endIdx + endMarker.length);

  const newHtml = before +
    `<div id="encrypted-payload" style="display:none">${payload}</div>` +
    after;

  writeFileSync(INPUT, newHtml, 'utf-8');
  console.log(`Encrypted ${protectedContent.length} chars into index.html`);
}

encrypt().catch(console.error);
