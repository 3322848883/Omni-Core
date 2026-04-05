"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.generateRandomString = generateRandomString;
exports.generateUUID = generateUUID;
exports.createHash = createHash;
exports.generateRandomNumber = generateRandomNumber;
exports.constantTimeCompare = constantTimeCompare;
exports.generateVpnUuid = generateVpnUuid;
exports.generateUserId = generateUserId;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const BCRYPT_ROUNDS = 12;
/**
 * Generate a random token
 */
function generateToken(length = 32) {
    return crypto_1.default.randomBytes(length).toString('hex');
}
/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, BCRYPT_ROUNDS);
}
/**
 * Verify a password against a hash
 */
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
/**
 * Encrypt data using AES-256-GCM
 */
function encrypt(text, secretKey) {
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const salt = crypto_1.default.randomBytes(SALT_LENGTH);
    const key = crypto_1.default.pbkdf2Sync(secretKey, salt, 100000, KEY_LENGTH, 'sha512');
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const result = Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
    return result;
}
/**
 * Decrypt data using AES-256-GCM
 */
function decrypt(encryptedData, secretKey) {
    const data = Buffer.from(encryptedData, 'base64');
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const key = crypto_1.default.pbkdf2Sync(secretKey, salt, 100000, KEY_LENGTH, 'sha512');
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}
/**
 * Generate a secure random string
 */
function generateRandomString(length = 32) {
    return crypto_1.default.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}
/**
 * Generate a UUID v4
 */
function generateUUID() {
    return crypto_1.default.randomUUID();
}
/**
 * Create a hash of data using specified algorithm
 */
function createHash(data, algorithm = 'sha256') {
    return crypto_1.default.createHash(algorithm).update(data).digest('hex');
}
/**
 * Generate a secure random number between min and max
 */
function generateRandomNumber(min, max) {
    const range = max - min + 1;
    const randomBytes = crypto_1.default.randomBytes(4);
    const randomValue = randomBytes.readUInt32LE(0);
    return min + (randomValue % range);
}
/**
 * Constant time comparison to prevent timing attacks
 */
function constantTimeCompare(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
/**
 * Generate VPN UUID for user
 */
function generateVpnUuid() {
    return crypto_1.default.randomUUID();
}
/**
 * Generate unique user ID
 */
function generateUserId() {
    return 'usr_' + crypto_1.default.randomBytes(8).toString('hex');
}
//# sourceMappingURL=crypto.js.map