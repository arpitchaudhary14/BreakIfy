import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateRandomToken, hashToken } from '../utils/crypto.js';
import { registerSchema, loginSchema, passwordSchema } from '../validators/auth.validator.js';

describe('Argon2id Password Security', () => {
  it('should securely hash password with Argon2id', async () => {
    const rawPassword = 'SecureP@ssword123';
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).not.toContain(rawPassword);
  });

  it('should successfully verify a correct password against its hash', async () => {
    const rawPassword = 'EnterpriseAuth2026!';
    const hash = await hashPassword(rawPassword);

    const isMatch = await verifyPassword(hash, rawPassword);
    expect(isMatch).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const rawPassword = 'EnterpriseAuth2026!';
    const hash = await hashPassword(rawPassword);

    const isMatch = await verifyPassword(hash, 'WrongPassword123');
    expect(isMatch).toBe(false);
  });
});

describe('Token Generation and Hashing', () => {
  it('should generate high-entropy tokens and valid SHA-256 digests', () => {
    const { raw, hashed } = generateRandomToken(32);

    expect(raw).toHaveLength(64); // 32 bytes hex encoded = 64 characters
    expect(hashed).toHaveLength(64); // SHA-256 output = 64 hex characters
    expect(hashed).toBe(hashToken(raw));
  });

  it('should produce identical SHA-256 hashes for identical tokens', () => {
    const token = 'sample-verification-token-12345';
    expect(hashToken(token)).toBe(hashToken(token));
  });
});

describe('Zod Authentication Validation', () => {
  it('should accept valid registration payload', () => {
    const validData = {
      name: 'Alex Vance',
      email: 'alex@breakify.site',
      password: 'StrongP@ssword1',
    };

    const parsed = registerSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid email formats', () => {
    const invalidData = {
      name: 'Alex Vance',
      email: 'not-an-email',
      password: 'StrongP@ssword1',
    };

    const parsed = registerSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it('should reject weak passwords failing complexity rules', () => {
    // Too short
    expect(passwordSchema.safeParse('Ab1!').success).toBe(false);
    // Missing number
    expect(passwordSchema.safeParse('PasswordOnly').success).toBe(false);
    // Missing uppercase
    expect(passwordSchema.safeParse('password123').success).toBe(false);
    // Missing lowercase
    expect(passwordSchema.safeParse('PASSWORD123').success).toBe(false);
  });

  it('should validate login credentials schema correctly', () => {
    expect(loginSchema.safeParse({ email: 'test@breakify.site', password: 'mypassword' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'bad-email', password: '' }).success).toBe(false);
  });
});
