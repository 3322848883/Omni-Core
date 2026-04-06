import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Generate a random token
 */
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(text: string, secretKey: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(secretKey, salt, 100000, KEY_LENGTH, 'sha512');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const result = Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  return result;
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encryptedData: string, secretKey: string): string {
  const data = Buffer.from(encryptedData, 'base64');
  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const key = crypto.pbkdf2Sync(secretKey, salt, 100000, KEY_LENGTH, 'sha512');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Generate a secure random string
 */
export function generateRandomString(length = 32): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Create a hash of data using specified algorithm
 */
export function createHash(data: string, algorithm = 'sha256'): string {
  return crypto.createHash(algorithm).update(data).digest('hex');
}

/**
 * Generate a secure random number between min and max
 */
export function generateRandomNumber(min: number, max: number): number {
  const range = max - min + 1;
  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32LE(0);
  return min + (randomValue % range);
}

/**
 * Constant time comparison to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Generate a unique VPN UUID
 */
export function generateVpnUuid(): string {
  return uuidv4();
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  return generateRandomString(16);
}

/**
 * Generate a unique order ID
 */
export function generateOrderId(): string {
  return `ord_${Date.now()}_${generateRandomString(8)}`;
}

/**
 * Generate a unique order number
 */
export function generateOrderNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = generateRandomString(4).toUpperCase();
  return `ORD${timestamp}${random}`;
}

/**
 * Generate a unique invite code
 */
export function generateInviteCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default {
  generateToken,
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  generateRandomString,
  generateUUID,
  createHash,
  generateRandomNumber,
  constantTimeCompare,
  generateVpnUuid,
  generateUserId,
  generateOrderId,
  generateOrderNo,
  generateInviteCode,
};
