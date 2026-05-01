export async function generateRSAKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyBuf = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyBuf = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKeyBuf))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKeyBuf))),
    rawKeyPair: keyPair,
  };
}

export async function generateSigningKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  const publicKeyBuf = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyBuf = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKeyBuf))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKeyBuf))),
    rawKeyPair: keyPair,
  };
}

export async function exportCryptoKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importPublicKey(pem: string) {
  const binaryDer = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

export async function importPrivateKey(pem: string) {
  const binaryDer = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

export async function rsaEncrypt(dataBuf: Uint8Array, publicKey: CryptoKey) {
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    dataBuf as BufferSource
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function rsaDecrypt(encryptedBase64: string, privateKey: CryptoKey) {
  const encryptedBuf = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBuf as BufferSource
  );
  return new Uint8Array(decrypted);
}

export async function rsaSign(dataBuf: Uint8Array, privateKey: CryptoKey) {
  const signature = await window.crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    dataBuf as BufferSource
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function rsaVerify(dataBuf: Uint8Array, signatureBase64: string, publicKey: CryptoKey) {
  const signatureBuf = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
  return await window.crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    publicKey,
    signatureBuf as BufferSource,
    dataBuf as BufferSource
  );
}

export async function generateAESKey() {
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return {
    key,
    rawKeyBase64: btoa(String.fromCharCode(...new Uint8Array(exported)))
  };
}

export async function importAESKey(rawKeyBase64: string) {
  const rawKey = Uint8Array.from(atob(rawKeyBase64), c => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "raw",
    rawKey as BufferSource,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
}

export async function aesEncrypt(text: string, key: CryptoKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    data as BufferSource
  );

  return {
    encryptedMessage: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function encryptBlob(blob: Blob, key: CryptoKey): Promise<{ encryptedBlob: Blob; iv: string }> {
  const data = await blob.arrayBuffer();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    data as BufferSource
  );

  return {
    encryptedBlob: new Blob([encrypted]),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptBlob(encryptedBlob: Blob, ivBase64: string, key: CryptoKey): Promise<Blob> {
  const encryptedBuf = await encryptedBlob.arrayBuffer();
  const ivBuf = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBuf as BufferSource,
    },
    key,
    encryptedBuf as BufferSource
  );
  
  return new Blob([decrypted]);
}

export async function aesDecrypt(encryptedBase64: string, ivBase64: string, key: CryptoKey) {
  const encryptedBuf = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const ivBuf = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBuf as BufferSource,
    },
    key,
    encryptedBuf as BufferSource
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// ── PBKDF2 for Vault ────────────────────────────────────────────────────────
export async function deriveVaultKey(password: string, saltHex: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password) as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const saltBuffer = Uint8Array.from(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export function generateSaltHex(bytes = 16) {
  const arr = new Uint8Array(bytes);
  window.crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data as BufferSource);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
