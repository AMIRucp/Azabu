import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const key = process.env.ASTER_ENCRYPTION_KEY;
  if (!key) throw new Error('ASTER_ENCRYPTION_KEY not configured');
  return Buffer.from(key, 'hex');
}

export function encryptCredentials(apiKey: string, apiSecret: string): {
  apiKeyEnc: string;
  apiSecretEnc: string;
  iv: string;
  authTag: string;
} {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const combined = JSON.stringify({ apiKey, apiSecret });

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(combined, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const mid = Math.floor(encrypted.length / 2);

  return {
    apiKeyEnc: encrypted.slice(0, mid),
    apiSecretEnc: encrypted.slice(mid),
    iv: iv.toString('hex'),
    authTag,
  };
}

export function decryptCredentials(
  apiKeyEnc: string,
  apiSecretEnc: string,
  ivHex: string,
  authTagHex: string
): { apiKey: string; apiSecret: string } {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = apiKeyEnc + apiSecretEnc;

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}
