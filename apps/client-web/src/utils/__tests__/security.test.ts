import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateEncryptionKey,
  encryptData,
  decryptData,
  maskEmail,
  maskPhone,
  maskIdCard,
  maskBankCard,
  maskName,
  maskIpAddress,
  maskToken,
  maskString,
  maskSensitiveFields,
  isSensitiveField,
  removeSensitiveFields,
  safeStringify,
  getSecurityConfig,
  getSensitiveFields,
} from '../security';
import { storage } from '../storage';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('Security Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateEncryptionKey', () => {
    it('should generate a 64-character hex key', () => {
      const key = generateEncryptionKey();
      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique keys', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const originalData = 'sensitive information';
      const key = generateEncryptionKey();

      const encrypted = await encryptData(originalData, key);
      expect(encrypted).toContain('__enc__');
      expect(encrypted).not.toBe(originalData);

      const decrypted = await decryptData(encrypted, key);
      expect(decrypted).toBe(originalData);
    });

    it('should return empty string for empty input', async () => {
      expect(await encryptData('')).toBe('');
      expect(await decryptData('')).toBe('');
    });

    it('should return original data if not encrypted format', async () => {
      const data = 'plain text';
      expect(await decryptData(data)).toBe(data);
    });

    it('should use different keys for different encryptions', () => {
      const data = 'test data';
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      const encrypted1 = encryptData(data, key1);
      const encrypted2 = encryptData(data, key2);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('maskEmail', () => {
    it('should mask email correctly', () => {
      expect(maskEmail('user@example.com')).toBe('u**r@example.com');
    });

    it('should handle short local part', () => {
      expect(maskEmail('ab@example.com')).toBe('**@example.com');
    });

    it('should handle single character local part', () => {
      expect(maskEmail('a@example.com')).toBe('*@example.com');
    });

    it('should handle empty string', () => {
      expect(maskEmail('')).toBe('');
    });

    it('should handle invalid email', () => {
      expect(maskEmail('invalid')).toBe('invalid');
    });
  });

  describe('maskPhone', () => {
    it('should mask phone correctly', () => {
      expect(maskPhone('13812345678')).toBe('138****5678');
    });

    it('should handle phone with country code', () => {
      // The + is removed by replace(/\D/g, '')
      expect(maskPhone('+8613812345678')).toBe('861******5678');
    });

    it('should handle short phone', () => {
      expect(maskPhone('123456')).toBe('123456');
    });

    it('should handle empty string', () => {
      expect(maskPhone('')).toBe('');
    });
  });

  describe('maskIdCard', () => {
    it('should mask ID card correctly', () => {
      // 18 digits - 8 visible = 10 masked
      expect(maskIdCard('110101199001011234')).toBe('1101**********1234');
    });

    it('should handle short ID', () => {
      expect(maskIdCard('1234567')).toBe('1234567');
    });

    it('should handle empty string', () => {
      expect(maskIdCard('')).toBe('');
    });
  });

  describe('maskBankCard', () => {
    it('should mask bank card correctly', () => {
      // 19 digits - 8 visible = 11 masked
      expect(maskBankCard('6222021234567890123')).toBe('6222***********0123');
    });

    it('should handle card with spaces', () => {
      expect(maskBankCard('6222 0212 3456 7890 123')).toBe('6222***********0123');
    });

    it('should handle short card number', () => {
      expect(maskBankCard('1234567')).toBe('1234567');
    });

    it('should handle empty string', () => {
      expect(maskBankCard('')).toBe('');
    });
  });

  describe('maskName', () => {
    it('should mask two-character name', () => {
      expect(maskName('张三')).toBe('张*');
    });

    it('should mask three-character name', () => {
      expect(maskName('张三丰')).toBe('张*丰');
    });

    it('should mask long name', () => {
      expect(maskName('欧阳锋')).toBe('欧*锋');
    });

    it('should handle single character', () => {
      expect(maskName('张')).toBe('张');
    });

    it('should handle empty string', () => {
      expect(maskName('')).toBe('');
    });
  });

  describe('maskIpAddress', () => {
    it('should mask IPv4 address', () => {
      expect(maskIpAddress('192.168.1.1')).toBe('192.*.*.1');
    });

    it('should mask IPv6 address', () => {
      expect(maskIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(
        '2001:0db8:****:7334'
      );
    });

    it('should handle empty string', () => {
      expect(maskIpAddress('')).toBe('');
    });
  });

  describe('maskToken', () => {
    it('should mask long token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const result = maskToken(token);
      expect(result.startsWith('eyJh')).toBe(true);
      expect(result.endsWith('VCJ9')).toBe(true);
      expect(result).toContain('********');
    });

    it('should mask short token completely', () => {
      expect(maskToken('abcdefgh')).toBe('********');
    });

    it('should handle empty string', () => {
      expect(maskToken('')).toBe('');
    });
  });

  describe('maskString', () => {
    it('should mask with default parameters', () => {
      // password123 has 11 chars, 2+2=4 visible, 7 masked but limited to 8
      expect(maskString('password123')).toBe('pa*******23');
    });

    it('should mask with custom parameters', () => {
      expect(maskString('password123', 3, 3)).toBe('pas*****123');
    });

    it('should handle short string', () => {
      expect(maskString('ab', 2, 2)).toBe('ab');
    });

    it('should handle empty string', () => {
      expect(maskString('')).toBe('');
    });
  });

  describe('maskSensitiveFields', () => {
    it('should mask sensitive fields in object', () => {
      const input = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com',
      };
      const result = maskSensitiveFields(input);
      expect(result.username).toBe('john');
      expect(result.password).not.toBe('secret123');
      expect(result.password).toContain('*');
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: 'john',
          password: 'secret123',
        },
      };
      const result = maskSensitiveFields(input);
      expect(result.user.name).toBe('john');
      expect(result.user.password).not.toBe('secret123');
    });

    it('should handle arrays', () => {
      const input = {
        users: [
          { name: 'john', password: 'secret1' },
          { name: 'jane', password: 'secret2' },
        ],
      };
      const result = maskSensitiveFields(input);
      expect(result.users[0].password).not.toBe('secret1');
      expect(result.users[1].password).not.toBe('secret2');
    });

    it('should use custom sensitive fields', () => {
      const input = {
        username: 'john',
        customSecret: 'secret',
      };
      const result = maskSensitiveFields(input, ['customSecret']);
      expect(result.username).toBe('john');
      expect(result.customSecret).not.toBe('secret');
    });
  });

  describe('isSensitiveField', () => {
    it('should identify password as sensitive', () => {
      expect(isSensitiveField('password')).toBe(true);
    });

    it('should identify token as sensitive', () => {
      expect(isSensitiveField('authToken')).toBe(true);
    });

    it('should identify email as sensitive', () => {
      expect(isSensitiveField('userEmail')).toBe(true);
    });

    it('should not identify regular fields as sensitive', () => {
      expect(isSensitiveField('username')).toBe(false);
      expect(isSensitiveField('createdAt')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isSensitiveField('PASSWORD')).toBe(true);
      expect(isSensitiveField('ApiKey')).toBe(true);
    });
  });

  describe('removeSensitiveFields', () => {
    it('should remove sensitive fields', () => {
      const input = {
        username: 'john',
        password: 'secret',
        email: 'john@example.com',
      };
      const result = removeSensitiveFields(input);
      expect(result.username).toBe('john');
      expect(result.password).toBeUndefined();
      expect(result.email).toBeUndefined();
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: 'john',
          password: 'secret',
        },
      };
      const result = removeSensitiveFields(input);
      expect(result.user!.name).toBe('john');
      expect(result.user!.password).toBeUndefined();
    });

    it('should handle empty object', () => {
      const result = removeSensitiveFields({});
      expect(result).toEqual({});
    });
  });

  describe('safeStringify', () => {
    it('should stringify without sensitive fields', () => {
      const input = {
        username: 'john',
        password: 'secret',
      };
      const result = safeStringify(input);
      expect(result).toContain('username');
      expect(result).not.toContain('password');
    });

    it('should return valid JSON', () => {
      const input = { a: 1, b: 2 };
      const result = safeStringify(input);
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('getSecurityConfig', () => {
    it('should return security configuration', () => {
      const config = getSecurityConfig();
      expect(config).toHaveProperty('ENCRYPTION_KEY_NAME');
      expect(config).toHaveProperty('SENSITIVE_PREFIX');
      expect(config).toHaveProperty('KEY_LENGTH');
      expect(config).toHaveProperty('IV_LENGTH');
      expect(config).toHaveProperty('MAX_LOG_ENTRIES');
      expect(config).toHaveProperty('LOG_STORAGE_KEY');
    });

    it('should return a copy of config', () => {
      const config1 = getSecurityConfig();
      const config2 = getSecurityConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('getSensitiveFields', () => {
    it('should return list of sensitive fields', () => {
      const fields = getSensitiveFields();
      expect(fields).toContain('password');
      expect(fields).toContain('token');
      expect(fields).toContain('email');
    });

    it('should return a copy of fields array', () => {
      const fields1 = getSensitiveFields();
      const fields2 = getSensitiveFields();
      expect(fields1).not.toBe(fields2);
      expect(fields1).toEqual(fields2);
    });
  });

  describe('Secure Storage', () => {
    it('should store and retrieve secure item', async () => {
      const key = 'test_key';
      const data = 'sensitive data';
      const encryptionKey = generateEncryptionKey();

      const encrypted = await encryptData(data, encryptionKey);
      vi.mocked(storage.get).mockReturnValue(encrypted);

      const result = storage.get<string>(key);
      const decrypted = await decryptData(result!, encryptionKey);

      expect(decrypted).toBe(data);
    });

    it('should handle missing secure item', () => {
      vi.mocked(storage.get).mockReturnValue(null);
      const result = storage.get<string>('nonexistent_key');
      expect(result).toBeNull();
    });
  });
});
