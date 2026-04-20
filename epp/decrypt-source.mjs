// decrypt-source.mjs — Extracts the unencrypted source from index.html for editing
// Usage: node decrypt-source.mjs

import { readFileSync, writeFileSync } from 'fs';
import { webcrypto } from 'crypto';
const subtle = webcrypto.subtle;

const PASSWORD = 'epp';
const INPUT = new URL('./index.html', import.meta.url).pathname;
const OUTPUT = new URL('./index.source.html', import.meta.url).pathname;

async function decrypt() {
  const html = readFileSync(INPUT, 'utf-8');

  const match = html.match(/<div id="encrypted-payload" style="display:none">(.*?)<\/div>/s);
  if (!match) {
    console.error('No encrypted payload found in index.html');
    process.exit(1);
  }

  const { salt, iv, data } = JSON.parse(match[1]);
  const fromB64 = s => Uint8Array.from(Buffer.from(s, 'base64'));

  const keyMaterial = await subtle.importKey(
    'raw', new TextEncoder().encode(PASSWORD), 'PBKDF2', false, ['deriveKey']
  );
  const key = await subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const decrypted = await subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(iv) },
    key,
    fromB64(data)
  );

  const content = new TextDecoder().decode(decrypted);

  // Rebuild full source: replace encrypted blob with markers + content
  const before = html.substring(0, html.indexOf(match[0]));
  const after = html.substring(html.indexOf(match[0]) + match[0].length);
  const source = before + '<!-- PROTECTED_START -->' + content + '<!-- PROTECTED_END -->' + after;

  writeFileSync(OUTPUT, source, 'utf-8');
  console.log(`Decrypted source saved to index.source.html (${source.length} chars)`);
}

decrypt().catch(console.error);
