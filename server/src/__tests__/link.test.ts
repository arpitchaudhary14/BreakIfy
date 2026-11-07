import { describe, it, expect } from 'vitest';
import { validateSafeUrl, isValidSlug, generateShortCode, RESERVED_SLUGS } from '../utils/url.util.js';
import { createLinkSchema, bulkActionSchema, geoRuleSchema, abTestingSchema } from '../validators/link.validator.js';
import { detectDeviceType } from '../utils/device.util.js';
import { lookupCountry } from '../utils/geo.util.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';

describe('Safe URL Validation & SSRF Prevention', () => {
  it('should accept valid HTTPS URLs', () => {
    const result = validateSafeUrl('https://github.com/breakify/product');
    expect(result.isValid).toBe(true);
    expect(result.normalizedUrl).toBe('https://github.com/breakify/product');
  });

  it('should accept valid HTTP URLs', () => {
    const result = validateSafeUrl('http://example.org/test?param=123');
    expect(result.isValid).toBe(true);
  });

  it('should reject non-HTTP protocols', () => {
    expect(validateSafeUrl('javascript:alert(1)').isValid).toBe(false);
    expect(validateSafeUrl('data:text/html,<script>alert(1)</script>').isValid).toBe(false);
    expect(validateSafeUrl('file:///etc/passwd').isValid).toBe(false);
    expect(validateSafeUrl('ftp://ftp.example.com').isValid).toBe(false);
  });

  it('should prevent SSRF targeting localhost, loopback, and cloud metadata', () => {
    expect(validateSafeUrl('http://localhost:8080').isValid).toBe(false);
    expect(validateSafeUrl('http://127.0.0.1:3000').isValid).toBe(false);
    expect(validateSafeUrl('http://0.0.0.0').isValid).toBe(false);
    expect(validateSafeUrl('http://169.254.169.254/latest/meta-data/').isValid).toBe(false);
    expect(validateSafeUrl('http://metadata.google.internal').isValid).toBe(false);
  });

  it('should prevent SSRF targeting private RFC 1918 subnets', () => {
    expect(validateSafeUrl('http://192.168.1.1').isValid).toBe(false);
    expect(validateSafeUrl('http://10.0.0.1').isValid).toBe(false);
    expect(validateSafeUrl('http://172.16.0.1').isValid).toBe(false);
  });
});

describe('Short Code Generation and Slug Rules', () => {
  it('should generate 7-character Base62 codes by default', () => {
    const code = generateShortCode();
    expect(code).toHaveLength(7);
    expect(/^[0-9a-zA-Z]+$/.test(code)).toBe(true);
  });

  it('should generate distinct codes on consecutive calls', () => {
    const code1 = generateShortCode();
    const code2 = generateShortCode();
    expect(code1).not.toBe(code2);
  });

  it('should validate custom slugs properly', () => {
    expect(isValidSlug('promo-2026')).toBe(true);
    expect(isValidSlug('v1_announcement')).toBe(true);
    expect(isValidSlug('ab')).toBe(false); // Too short (min 3)
    expect(isValidSlug('slug with space')).toBe(false); // Invalid chars
    expect(isValidSlug('invalid@slug!')).toBe(false);
  });

  it('should disallow reserved platform routes from being claimed as slugs', () => {
    expect(RESERVED_SLUGS.has('api')).toBe(true);
    expect(RESERVED_SLUGS.has('health')).toBe(true);
    expect(RESERVED_SLUGS.has('auth')).toBe(true);
    expect(RESERVED_SLUGS.has('settings')).toBe(true);

    expect(isValidSlug('api')).toBe(false);
    expect(isValidSlug('health')).toBe(false);
    expect(isValidSlug('settings')).toBe(false);
    expect(isValidSlug('auth')).toBe(false);
  });
});

describe('Advanced Link Controls Validation', () => {
  it('should securely hash and verify link passwords', async () => {
    const secret = 'EnterpriseKey2026!';
    const hash = await hashPassword(secret);

    expect(await verifyPassword(hash, secret)).toBe(true);
    expect(await verifyPassword(hash, 'wrong-key')).toBe(false);
  });

  it('should validate geo rule schema and 2-letter uppercase ISO country code', () => {
    expect(geoRuleSchema.safeParse({ countryCode: 'us', destinationUrl: 'https://us.example.com' }).success).toBe(true);
    expect(geoRuleSchema.safeParse({ countryCode: 'USA', destinationUrl: 'https://us.example.com' }).success).toBe(false);
    expect(geoRuleSchema.safeParse({ countryCode: 'US', destinationUrl: 'javascript:alert(1)' }).success).toBe(false);
  });

  it('should validate A/B testing schema and weights', () => {
    const abPayload = {
      enabled: true,
      variants: [
        { name: 'Variant A', destinationUrl: 'https://example.com/page-a', weight: 50 },
        { name: 'Variant B', destinationUrl: 'https://example.com/page-b', weight: 50 },
      ],
    };
    expect(abTestingSchema.safeParse(abPayload).success).toBe(true);
  });

  it('should parse user-agent into mobile, tablet, or desktop', () => {
    const iPhoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
    const iPadUA = 'Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    expect(detectDeviceType(iPhoneUA)).toBe('mobile');
    expect(detectDeviceType(iPadUA)).toBe('tablet');
    expect(detectDeviceType(desktopUA)).toBe('desktop');
  });

  it('should extract country from edge proxy headers with priority', () => {
    const headers = { 'cf-ipcountry': 'de' };
    const res = lookupCountry('127.0.0.1', headers);
    expect(res.country).toBe('DE');
    expect(res.source).toBe('header');
  });

  it('should validate complete createLinkSchema with advanced controls', () => {
    const valid = {
      originalUrl: 'https://breakify.site/docs',
      customSlug: 'my-docs',
      title: 'Documentation',
      password: 'Protected123',
      maxClicks: 500,
      tags: ['docs', 'official'],
      geoRules: [{ countryCode: 'DE', destinationUrl: 'https://de.breakify.site/docs' }],
      deviceRules: { mobile: 'https://m.breakify.site/docs' },
    };
    expect(createLinkSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject link creation when startsAt is after expiresAt', () => {
    const invalidSchedule = {
      originalUrl: 'https://breakify.site/docs',
      startsAt: '2026-12-01T00:00:00.000Z',
      expiresAt: '2026-11-01T00:00:00.000Z',
    };
    const result = createLinkSchema.safeParse(invalidSchedule);
    expect(result.success).toBe(false);
  });

  it('should accept link creation when startsAt is before expiresAt', () => {
    const validSchedule = {
      originalUrl: 'https://breakify.site/docs',
      startsAt: '2026-11-01T00:00:00.000Z',
      expiresAt: '2026-12-01T00:00:00.000Z',
    };
    const result = createLinkSchema.safeParse(validSchedule);
    expect(result.success).toBe(true);
  });
});

describe('Zod Bulk Operation Validation', () => {
  it('should validate bulkActionSchema with proper ObjectIds', () => {
    const validBulk = {
      linkIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      action: 'activate',
    };
    expect(bulkActionSchema.safeParse(validBulk).success).toBe(true);
  });

  it('should reject bulkActionSchema with empty link array or invalid ID format', () => {
    expect(bulkActionSchema.safeParse({ linkIds: [], action: 'delete' }).success).toBe(false);
    expect(bulkActionSchema.safeParse({ linkIds: ['invalid-id'], action: 'delete' }).success).toBe(false);
  });
});
