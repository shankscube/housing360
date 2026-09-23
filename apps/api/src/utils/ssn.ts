import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function keyBuffer(): Buffer {
  return Buffer.from(env.security.ssnEncryptionKey, 'hex');
}

/** Encrypts a plaintext SSN. Output packs `iv:authTag:ciphertext`, each hex-encoded. */
export function encryptSsn(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyBuffer(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

/** Reverses `encryptSsn`. Throws if the packed value is malformed or the auth tag doesn't verify. */
export function decryptSsn(packed: string): string {
  const [ivHex, authTagHex, ciphertextHex] = packed.split(':');
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Malformed encrypted SSN value');
  }
  const decipher = createDecipheriv(ALGORITHM, keyBuffer(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

/**
 * Deterministic HMAC of a normalized SSN, keyed by `SSN_HASH_SECRET` (not the
 * encryption key) — used only for duplicate matching, never for display or
 * decryption. Digits are stripped before hashing so "123-45-6789" and
 * "123456789" match.
 */
export function hashSsn(plaintext: string): string {
  const normalized = plaintext.replace(/\D/g, '');
  return createHmac('sha256', env.security.ssnHashSecret).update(normalized).digest('hex');
}

/** Last 4 digits of an SSN, for display. */
export function lastFour(plaintext: string): string {
  const normalized = plaintext.replace(/\D/g, '');
  return normalized.slice(-4);
}
