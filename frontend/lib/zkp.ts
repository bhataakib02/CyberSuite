
/**
 * Client-side ZKP Proof Generator
 * Uses Web Crypto API for secure hashing
 */
export async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function generateZKPProof(attribute: string, challenge: string, nonce: string) {
  // 1. Generate Commitment: Hash(attribute + nonce)
  const commitment = await sha256(attribute + nonce);

  // 2. Generate Response: Hash(attribute + challenge + nonce)
  const response = await sha256(attribute + challenge + nonce);

  return {
    commitment,
    challenge,
    response,
    nonce
  };
}
