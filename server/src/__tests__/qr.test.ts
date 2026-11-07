import { describe, it, expect } from 'vitest';
import {
  getLuminance,
  getContrastRatio,
  validateQrContrast,
  generateQrSvg,
  generateQrPngBuffer,
  generateQrDataUrl,
} from '../utils/qr.util.js';
import { qrGenerateSchema } from '../validators/qr.validator.js';

describe('QR Luminance and Contrast Calculation', () => {
  it('should calculate correct luminance for pure black and pure white', () => {
    expect(getLuminance('#000000')).toBe(0);
    expect(getLuminance('#ffffff')).toBeCloseTo(1, 2);
  });

  it('should calculate WCAG maximum contrast 21:1 for black and white', () => {
    const ratio = getContrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('should detect low contrast and warn when contrast ratio is below 3:1', () => {
    // Light gray on white
    const lowContrast = validateQrContrast('#e4e4e7', '#ffffff');
    expect(lowContrast.isReadable).toBe(false);
    expect(lowContrast.ratio).toBeLessThan(3.0);
    expect(lowContrast.warning).toBeDefined();

    // Dark gray on black
    const darkLowContrast = validateQrContrast('#27272a', '#000000');
    expect(darkLowContrast.isReadable).toBe(false);
  });

  it('should approve high contrast combinations', () => {
    // Pure black on pure white
    const standard = validateQrContrast('#000000', '#ffffff');
    expect(standard.isReadable).toBe(true);
    expect(standard.ratio).toBeGreaterThan(10);

    // Deep zinc on white
    const zincContrast = validateQrContrast('#18181b', '#f4f4f5');
    expect(zincContrast.isReadable).toBe(true);
    expect(zincContrast.ratio).toBeGreaterThan(7);
  });
});

describe('QR Code Generation Engines', () => {
  it('should generate valid SVG string containing <svg> element', async () => {
    const svg = await generateQrSvg('https://breakify.site/test-link?src=qr', {
      margin: 1,
      errorCorrectionLevel: 'H',
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox');
  });

  it('should generate valid PNG Buffer with PNG header magic bytes', async () => {
    const buffer = await generateQrPngBuffer('https://breakify.site/test-link?src=qr', {
      width: 256,
      errorCorrectionLevel: 'M',
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);
    // PNG magic bytes: 0x89 0x50 0x4E 0x47
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);
  });

  it('should generate valid DataURL string starting with data:image/png;base64,', async () => {
    const dataUrl = await generateQrDataUrl('https://breakify.site/test-link');
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });
});

describe('QR Validator Schema', () => {
  it('should accept valid QR generation requests with high contrast', () => {
    const valid = {
      text: 'https://breakify.site/demo',
      colorDark: '#000000',
      colorLight: '#ffffff',
      errorCorrectionLevel: 'H',
      width: 512,
    };
    const res = qrGenerateSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('should reject unreadable low-contrast color combinations', () => {
    const unreadable = {
      text: 'https://breakify.site/demo',
      colorDark: '#ffffff',
      colorLight: '#f4f4f5',
    };
    const res = qrGenerateSchema.safeParse(unreadable);
    expect(res.success).toBe(false);
  });
});

