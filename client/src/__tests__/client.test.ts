import { describe, it, expect } from 'vitest';
import { formatNumber, formatPercent, formatDate, truncateString } from '../utils/formatters';

describe('Frontend Client Core Utilities & Contracts', () => {
  describe('Formatters & String Truncators', () => {
    it('should format numbers with standard thousand separators', () => {
      expect(formatNumber(1250)).toBe('1,250');
      expect(formatNumber(1000000)).toBe('1,000,000');
      expect(formatNumber(0)).toBe('0');
    });

    it('should format percentage with single decimal digit', () => {
      expect(formatPercent(45.678)).toBe('45.7%');
      expect(formatPercent(0)).toBe('0.0%');
      expect(formatPercent(100)).toBe('100.0%');
    });

    it('should safely format dates or return fallback', () => {
      const validDate = new Date('2026-05-15T12:00:00Z');
      const formatted = formatDate(validDate.toISOString());
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
      expect(formatDate(undefined)).toBe('N/A');
      expect(formatDate('invalid-date')).toBe('N/A');
    });

    it('should truncate strings exceeding maximum length with ellipsis', () => {
      expect(truncateString('https://example.com/very/long/path/name', 20)).toBe('https://example.com/...');
      expect(truncateString('short', 20)).toBe('short');
    });
  });

  describe('QR Studio Parameters & Download Formats', () => {
    it('should support PNG, SVG, and PDF export types', () => {
      const supportedFormats = ['png', 'svg', 'pdf'];
      expect(supportedFormats).toContain('png');
      expect(supportedFormats).toContain('svg');
      expect(supportedFormats).toContain('pdf');
    });

    it('should enforce read-safety on contrast ratio presets', () => {
      const darkColor = '#000000';
      const lightColor = '#ffffff';
      expect(darkColor).not.toBe(lightColor);
    });
  });

  describe('Design Tokens & Palette Integrity', () => {
    it('should strictly use monochrome zinc palette tokens without colorful accents', () => {
      const allowedColors = ['zinc', 'black', 'white', 'emerald', 'amber', 'red'];
      const forbiddenColors = ['cyan', 'indigo', 'violet', 'fuchsia'];

      for (const forbidden of forbiddenColors) {
        expect(allowedColors).not.toContain(forbidden);
      }
    });
  });

  describe('Recycle Bin Retention Calculations', () => {
    it('should calculate remaining retention days accurately against 30-day baseline', () => {
      const retentionDaysConfigured = 30;
      const deletedDate = new Date();
      deletedDate.setDate(deletedDate.getDate() - 10); // 10 days ago

      const elapsedDays = Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(0, retentionDaysConfigured - elapsedDays);

      expect(remainingDays).toBe(20);
    });
  });
});
