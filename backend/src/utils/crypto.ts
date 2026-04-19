import crypto from 'crypto';

// ── AES-256-GCM ─────────────────────────────────────────────────────────────

export function aesEncrypt(plaintext: string, key: Buffer): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
    };
}

export function aesDecrypt(encrypted: string, iv: string, tag: string, key: Buffer): string {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'base64')),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}

export function generateAesKey(): Buffer {
    return crypto.randomBytes(32); // 256-bit key
}

// ── RSA ─────────────────────────────────────────────────────────────────────

export function generateRsaKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { publicKey, privateKey };
}

export function rsaEncrypt(data: string, publicKeyPem: string): string {
    const encrypted = crypto.publicEncrypt(
        { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
        Buffer.from(data)
    );
    return encrypted.toString('base64');
}

export function rsaDecrypt(encrypted: string, privateKeyPem: string): string {
    const decrypted = crypto.privateDecrypt(
        { key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
        Buffer.from(encrypted, 'base64')
    );
    return decrypted.toString('utf8');
}

// ── Hashing ─────────────────────────────────────────────────────────────────

export function sha1Hash(input: string): string {
    return crypto.createHash('sha1').update(input.toUpperCase()).digest('hex');
}

export function hmacSign(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// ── Random ──────────────────────────────────────────────────────────────────

export function generateSecureToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
}
