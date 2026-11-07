import QRCode, { QRCodeErrorCorrectionLevel } from 'qrcode';

export interface QrOptions {
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
  margin?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Calculates the relative luminance of a color given as a hex string (#RGB or #RRGGBB).
 */
export function getLuminance(hex: string): number {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) {
    return 0; // Default fallback
  }

  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates the contrast ratio between two hex colors according to WCAG guidelines.
 * Returns ratio between 1 and 21.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Ensures QR foreground and background have sufficient contrast to remain readable.
 * Minimum recommended contrast for optical QR scanning is 3.0:1.
 */
export function validateQrContrast(
  darkColor = '#000000',
  lightColor = '#ffffff'
): { isReadable: boolean; ratio: number; warning?: string } {
  const ratio = getContrastRatio(darkColor, lightColor);
  if (ratio < 3.0) {
    return {
      isReadable: false,
      ratio,
      warning: `Contrast ratio is ${ratio.toFixed(2)}:1, which is below the safe threshold of 3.0:1. The QR code may be unreadable by cameras.`,
    };
  }
  return { isReadable: true, ratio };
}

/**
 * Generates an SVG string representation of a QR code.
 */
export async function generateQrSvg(text: string, options: QrOptions = {}): Promise<string> {
  const { errorCorrectionLevel = 'M', margin = 2, color } = options;

  return QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel,
    margin,
    color: {
      dark: color?.dark || '#000000',
      light: color?.light || '#ffffff',
    },
  });
}

/**
 * Generates a PNG Buffer representation of a QR code.
 */
export async function generateQrPngBuffer(text: string, options: QrOptions = {}): Promise<Buffer> {
  const { errorCorrectionLevel = 'M', margin = 2, width = 512, color } = options;

  return QRCode.toBuffer(text, {
    type: 'png',
    errorCorrectionLevel,
    margin,
    width,
    color: {
      dark: color?.dark || '#000000',
      light: color?.light || '#ffffff',
    },
  });
}

/**
 * Generates a Data URL for inline browser display.
 */
export async function generateQrDataUrl(text: string, options: QrOptions = {}): Promise<string> {
  const { errorCorrectionLevel = 'M', margin = 2, width = 512, color } = options;

  return QRCode.toDataURL(text, {
    errorCorrectionLevel,
    margin,
    width,
    color: {
      dark: color?.dark || '#000000',
      light: color?.light || '#ffffff',
    },
  });
}

