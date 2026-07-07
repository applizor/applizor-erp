import crypto from 'crypto';
import { config } from '../config/env';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer | null {
    const rawKey = config.ENCRYPTION_KEY;
    if (!rawKey) return null;
    return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypts a PII string using AES-256-GCM.
 * Output format: "enc:ivHex:authTagHex:encryptedHex"
 * If ENCRYPTION_KEY is not set, returns the original value unchanged.
 */
export function encryptPII(value: string | null | undefined): string | null | undefined {
    if (!value) return value;
    const key = getEncryptionKey();
    if (!key) return value; // Backward compatibility fallback

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a PII string that was encrypted with encryptPII.
 * If the value is not encrypted (does not start with "enc:"), returns the value as-is.
 * If ENCRYPTION_KEY is not set, returns "[ENCRYPTED]" to avoid leaking raw ciphertext.
 */
export function decryptPII(value: string | null | undefined): string | null | undefined {
    if (!value) return value;
    if (!value.startsWith('enc:')) return value; // Not encrypted

    const key = getEncryptionKey();
    if (!key) {
        console.warn('[Crypto] Encryption key not configured; cannot decrypt PII field.');
        return '[ENCRYPTED]';
    }

    try {
        const parts = value.split(':');
        if (parts.length !== 4) return value;
        const [_, ivHex, authTagHex, encryptedHex] = parts;

        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (err) {
        console.error('[Crypto] Decryption failed for value:', err);
        return '[DECRYPTION_FAILED]';
    }
}
