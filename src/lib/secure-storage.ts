// Secure local encryption utilities using WebCrypto API
// Zero-knowledge: passphrase is never persisted; caller should keep it in memory only.

export type EncryptedBlobV1 = {
  v: 1;
  alg: 'AES-GCM';
  kdf: 'PBKDF2';
  iter: number; // PBKDF2 iterations
  salt: string; // base64
  iv: string;   // base64
  ct: string;   // base64 ciphertext
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
}

function fromBase64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function deriveKey(passphrase: string, salt: ArrayBuffer, iterations = 150_000): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptString(plaintext: string, passphrase: string): Promise<EncryptedBlobV1> {
  const salt = crypto.getRandomValues(new Uint8Array(16)).buffer;
  const iv = crypto.getRandomValues(new Uint8Array(12)).buffer;
  const iterations = 150_000;
  const key = await deriveKey(passphrase, salt, iterations);
  const ctBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textEncoder.encode(plaintext)
  );
  return {
    v: 1,
    alg: 'AES-GCM',
    kdf: 'PBKDF2',
    iter: iterations,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ct: toBase64(ctBuf),
  };
}

export async function decryptString(blob: EncryptedBlobV1, passphrase: string): Promise<string> {
  if (!blob || blob.v !== 1 || blob.alg !== 'AES-GCM') throw new Error('Unsupported format');
  const salt = fromBase64(blob.salt);
  const iv = fromBase64(blob.iv);
  const key = await deriveKey(passphrase, salt, blob.iter || 150_000);
  const ptBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    fromBase64(blob.ct)
  );
  return textDecoder.decode(ptBuf);
}

export function isEncryptedPayload(s: string | null | undefined): boolean {
  if (!s) return false;
  try {
    const obj = JSON.parse(s);
    return obj && obj.v === 1 && obj.alg === 'AES-GCM' && !!obj.ct;
  } catch {
    return false;
  }
}
