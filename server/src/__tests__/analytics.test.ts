import { describe, it, expect } from 'vitest';
import {
  detectBot,
  generateVisitorHash,
  normalizeReferrer,
  parseBrowserAndOs,
} from '../utils/analytics.util.js';

describe('Analytics Bot Detection', () => {
  it('should detect search engine crawlers and automated scraper user agents', () => {
    const googlebot = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    const bingbot = 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';
    const curl = 'curl/7.88.1';
    const python = 'python-requests/2.31.0';
    const headless = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36';

    expect(detectBot(googlebot)).toBe(true);
    expect(detectBot(bingbot)).toBe(true);
    expect(detectBot(curl)).toBe(true);
    expect(detectBot(python)).toBe(true);
    expect(detectBot(headless)).toBe(true);
  });

  it('should accept genuine human browser user agents', () => {
    const chromeMac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    const safariIPhone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1';
    const firefoxWindows = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0';

    expect(detectBot(chromeMac)).toBe(false);
    expect(detectBot(safariIPhone)).toBe(false);
    expect(detectBot(firefoxWindows)).toBe(false);
  });
});

describe('Privacy-Preserving Visitor Hashing', () => {
  it('should generate a 16-character pseudonymous hex hash without storing raw IP', () => {
    const hash = generateVisitorHash('198.51.100.45', 'Mozilla/5.0 Chrome/120.0');
    expect(hash).toHaveLength(16);
    expect(/^[0-9a-f]{16}$/.test(hash)).toBe(true);
    // Ensure raw IP is never exposed or recoverable in the hash output
    expect(hash).not.toContain('198.51.100.45');
  });

  it('should produce identical hash for same visitor on the same day bucket', () => {
    const hash1 = generateVisitorHash('203.0.113.19', 'Mozilla/5.0 Safari/605.1');
    const hash2 = generateVisitorHash('203.0.113.19', 'Mozilla/5.0 Safari/605.1');
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different IP addresses', () => {
    const hash1 = generateVisitorHash('192.0.2.1', 'Mozilla/5.0 Safari/605.1');
    const hash2 = generateVisitorHash('192.0.2.2', 'Mozilla/5.0 Safari/605.1');
    expect(hash1).not.toBe(hash2);
  });
});

describe('Referrer Normalization', () => {
  it('should normalize known social and search referrers', () => {
    expect(normalizeReferrer('https://www.google.com/search?q=breakify')).toBe('google.com');
    expect(normalizeReferrer('https://t.co/xyz123')).toBe('x.com');
    expect(normalizeReferrer('https://lnkd.in/eAbCdEf')).toBe('linkedin.com');
    expect(normalizeReferrer('https://m.facebook.com/posts/123')).toBe('facebook.com');
  });

  it('should fallback to Direct for missing or malformed referrers', () => {
    expect(normalizeReferrer('')).toBe('Direct');
    expect(normalizeReferrer(undefined)).toBe('Direct');
    expect(normalizeReferrer('not-a-valid-url')).toBe('Direct');
  });
});

describe('Browser and OS Classification', () => {
  it('should correctly classify desktop Chrome on macOS', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    const parsed = parseBrowserAndOs(ua);
    expect(parsed.browser).toBe('Chrome');
    expect(parsed.os).toBe('macOS');
  });

  it('should correctly classify Safari on iOS iPhone', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1';
    const parsed = parseBrowserAndOs(ua);
    expect(parsed.browser).toBe('Mobile Safari');
    expect(parsed.os).toBe('iOS');
  });
});
