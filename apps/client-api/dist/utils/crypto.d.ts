/**
 * Generate a random token
 */
export declare function generateToken(length?: number): string;
/**
 * Hash a password using bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verify a password against a hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Encrypt data using AES-256-GCM
 */
export declare function encrypt(text: string, secretKey: string): string;
/**
 * Decrypt data using AES-256-GCM
 */
export declare function decrypt(encryptedData: string, secretKey: string): string;
/**
 * Generate a secure random string
 */
export declare function generateRandomString(length?: number): string;
/**
 * Generate a UUID v4
 */
export declare function generateUUID(): string;
/**
 * Create a hash of data using specified algorithm
 */
export declare function createHash(data: string, algorithm?: string): string;
/**
 * Generate a secure random number between min and max
 */
export declare function generateRandomNumber(min: number, max: number): number;
/**
 * Constant time comparison to prevent timing attacks
 */
export declare function constantTimeCompare(a: string, b: string): boolean;
/**
 * Generate VPN UUID for user
 */
export declare function generateVpnUuid(): string;
/**
 * Generate unique user ID
 */
export declare function generateUserId(): string;
//# sourceMappingURL=crypto.d.ts.map