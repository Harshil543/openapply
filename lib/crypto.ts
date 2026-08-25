const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const STORAGE_KEY = 'openapply_encryption_key';

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = await new Promise<string | null>((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const val = result[STORAGE_KEY];
      resolve(typeof val === 'string' ? val : null);
    });
  });

  if (stored) {
    const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey('raw', raw, { name: ALGORITHM }, false, ['encrypt', 'decrypt']);
  }

  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  await new Promise<void>((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: b64 }, resolve);
  });

  return key;
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptSecret(ciphertext: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}
