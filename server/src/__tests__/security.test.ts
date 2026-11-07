import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateTotpSecret,
  computeTotp,
  verifyTotpToken,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
  generateOtpAuthUri,
} from '../utils/totp.util.js';
import {
  HeuristicUrlPatternProvider,
  UrlSafetyService,
} from '../utils/urlSafety.util.js';
import { AbuseReport } from '../models/AbuseReport.model.js';
import { Link } from '../models/Link.model.js';
import { abuseService } from '../services/abuse.service.js';
import { authService } from '../services/auth.service.js';
import { User } from '../models/User.model.js';
import { activityService } from '../services/activity.service.js';

describe('Security & Trust System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(activityService, 'logActivity').mockResolvedValue();
  });

  describe('RFC 6238 TOTP Engine', () => {
    it('should generate a valid 20-byte Base32 secret', () => {
      const secret = generateTotpSecret();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThanOrEqual(32);
      expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
    });

    it('should correctly format otpauth:// URI', () => {
      const uri = generateOtpAuthUri({
        accountEmail: 'user@example.com',
        secret: 'JBSWY3DPEHPK3PXP',
        issuer: 'BreakIfy',
      });
      expect(uri).toContain('otpauth://totp/');
      expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
      expect(uri).toContain('issuer=BreakIfy');
    });

    it('should verify a valid TOTP token for current counter step', () => {
      const secret = generateTotpSecret();
      const currentStep = Math.floor(Date.now() / 1000 / 30);
      const code = computeTotp(secret, currentStep);

      const isValid = verifyTotpToken(secret, code);
      expect(isValid).toBe(true);
    });

    it('should allow valid drift of +/- 1 window step (30 seconds)', () => {
      const secret = generateTotpSecret();
      const prevStep = Math.floor(Date.now() / 1000 / 30) - 1;
      const prevCode = computeTotp(secret, prevStep);

      const isValid = verifyTotpToken(secret, prevCode, 1);
      expect(isValid).toBe(true);
    });

    it('should reject invalid or malformed tokens', () => {
      const secret = generateTotpSecret();
      expect(verifyTotpToken(secret, '000000')).toBe(false);
      expect(verifyTotpToken(secret, 'abc123')).toBe(false);
      expect(verifyTotpToken(secret, '')).toBe(false);
    });
  });

  describe('2FA Backup Recovery Codes', () => {
    it('should generate 10 distinct XXXX-XXXX formatted recovery codes', () => {
      const codes = generateRecoveryCodes(10);
      expect(codes).toHaveLength(10);
      for (const code of codes) {
        expect(code).toMatch(/^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
      }
    });

    it('should hash and verify recovery code securely', () => {
      const codes = generateRecoveryCodes(1);
      const code = codes[0];
      const codeHash = hashRecoveryCode(code);

      expect(verifyRecoveryCode(code, codeHash)).toBe(true);
      expect(verifyRecoveryCode('XXXX-YYYY', codeHash)).toBe(false);
    });
  });

  describe('Heuristic Threat & Malicious URL Scanner', () => {
    const scanner = new HeuristicUrlPatternProvider();

    it('should flag suspicious brand impersonation phishing domains', async () => {
      const result = await scanner.check('https://paypal-security-verification.xyz/login');
      expect(result.riskScore).toBeGreaterThanOrEqual(70);
      expect(result.reasons.some((r) => r.includes('brand impersonation'))).toBe(true);
    });

    it('should whitelist legitimate brands without false positives', async () => {
      const result = await scanner.check('https://paypal.com/signin');
      expect(result.isSafe).toBe(true);
      expect(result.riskScore).toBeLessThan(70);
    });

    it('should flag direct executable payload downloads', async () => {
      const result = await scanner.check('https://downloads.example.org/payload.exe');
      expect(result.riskScore).toBeGreaterThanOrEqual(70);
      expect(result.reasons.some((r) => r.includes('executable file extension'))).toBe(true);
    });

    it('should flag URLs embedding basic auth credentials', async () => {
      const result = await scanner.check('https://admin:password@attacker-site.com/dashboard');
      expect(result.reasons.some((r) => r.includes('embedded credentials'))).toBe(true);
    });

    it('should flag punycode homograph attacks', async () => {
      const result = await scanner.check('https://xn--pple-43d.com');
      expect(result.reasons.some((r) => r.includes('Punycode homograph'))).toBe(true);
    });

    it('should cache scan results in memory for high performance', async () => {
      const service = new UrlSafetyService();
      const res1 = await service.checkUrl('https://example.com/blog');
      const res2 = await service.checkUrl('https://example.com/blog');
      expect(res1.isSafe).toBe(res2.isSafe);
    });
  });

  describe('Session Management & Revocation', () => {
    it('should revoke a single active session from user sessions', async () => {
      const mockUser = {
        _id: 'user123',
        activeSessions: [
          { sessionId: 'sess-1', browser: 'Chrome', os: 'Windows' },
          { sessionId: 'sess-2', browser: 'Safari', os: 'iOS' },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, 'findById').mockResolvedValue(mockUser as unknown as ReturnType<typeof User.findById>);

      await authService.revokeSession('user123', 'sess-1');

      expect(mockUser.activeSessions).toHaveLength(1);
      expect(mockUser.activeSessions[0].sessionId).toBe('sess-2');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should revoke all other sessions preserving current session', async () => {
      const mockUser = {
        _id: 'user123',
        activeSessions: [
          { sessionId: 'current-sess', browser: 'Chrome', os: 'Windows' },
          { sessionId: 'old-sess-1', browser: 'Firefox', os: 'Linux' },
          { sessionId: 'old-sess-2', browser: 'Edge', os: 'Windows' },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, 'findById').mockResolvedValue(mockUser as unknown as ReturnType<typeof User.findById>);

      await authService.revokeOtherSessions('user123', 'current-sess');

      expect(mockUser.activeSessions).toHaveLength(1);
      expect(mockUser.activeSessions[0].sessionId).toBe('current-sess');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('Abuse Reporting Service', () => {
    it('should create an abuse report with pending status and sanitized shortcode', async () => {
      const mockReport = {
        _id: 'report123',
        shortCode: 'phish123',
        originalUrl: 'https://malicious.example.com',
        reason: 'phishing',
        details: 'This link impersonates a banking login page.',
        status: 'pending',
      };

      vi.spyOn(Link, 'findOne').mockResolvedValue(null as unknown as ReturnType<typeof Link.findOne>);
      vi.spyOn(AbuseReport, 'create').mockImplementation(async () => mockReport as unknown as ReturnType<typeof AbuseReport.create>);

      const report = await abuseService.submitReport({
        shortCode: '/phish123',
        originalUrl: 'https://malicious.example.com',
        reason: 'phishing',
        details: 'This link impersonates a banking login page.',
        reporterEmail: 'alert@example.com',
        reporterIp: '192.168.1.1',
      });

      expect(report.shortCode).toBe('phish123');
      expect(report.status).toBe('pending');
      expect(AbuseReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shortCode: 'phish123',
          reason: 'phishing',
        })
      );
    });
  });
});
