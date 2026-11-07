import QRCode, { QRCodeErrorCorrectionLevel } from 'qrcode';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

export interface QrCustomization {
  foreground: string;
  background: string;
  margin: number;
  width: number;
  errorCorrectionLevel: QRCodeErrorCorrectionLevel;
  embedLogo: boolean;
  logoUrl?: string;
  dotStyle?: 'square' | 'rounded';
}

export const DEFAULT_QR_CUSTOMIZATION: QrCustomization = {
  foreground: '#000000',
  background: '#ffffff',
  margin: 2,
  width: 512,
  errorCorrectionLevel: 'M',
  embedLogo: false,
  dotStyle: 'square',
};

/**
 * Calculates relative luminance for WCAG contrast checking.
 */
export function getLuminance(hex: string): number {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return 0;

  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates contrast ratio between two hex colors.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Renders QR code onto an HTMLCanvasElement with optional center logo embedding.
 */
export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options: QrCustomization
): Promise<void> {
  const ecLevel: QRCodeErrorCorrectionLevel = options.embedLogo ? 'H' : options.errorCorrectionLevel;

  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: ecLevel,
    margin: options.margin,
    width: options.width,
    color: {
      dark: options.foreground,
      light: options.background,
    },
  });

  if (options.embedLogo && options.logoUrl) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const size = canvas.width;
        // Keep logo within 20% of the total QR width to maintain scannability
        const logoSize = Math.floor(size * 0.2);
        const center = Math.floor((size - logoSize) / 2);
        const padding = 6;

        // Draw protective background pad behind logo
        ctx.fillStyle = options.background;
        ctx.beginPath();
        const padX = center - padding;
        const padY = center - padding;
        const padSize = logoSize + padding * 2;
        const radius = 8;

        ctx.moveTo(padX + radius, padY);
        ctx.arcTo(padX + padSize, padY, padX + padSize, padY + padSize, radius);
        ctx.arcTo(padX + padSize, padY + padSize, padX, padY + padSize, radius);
        ctx.arcTo(padX, padY + padSize, padX, padY, radius);
        ctx.arcTo(padX, padY, padX + padSize, padY, radius);
        ctx.closePath();
        ctx.fill();

        // Draw logo
        ctx.drawImage(img, center, center, logoSize, logoSize);
        resolve();
      };
      img.onerror = () => {
        // Fall back cleanly if logo fails to load
        resolve();
      };
      img.src = options.logoUrl || '';
    });
  }
}

/**
 * Generates an SVG string representation of the QR code.
 */
export async function generateQrSvgString(
  text: string,
  options: QrCustomization
): Promise<string> {
  const ecLevel: QRCodeErrorCorrectionLevel = options.embedLogo ? 'H' : options.errorCorrectionLevel;

  return QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: ecLevel,
    margin: options.margin,
    width: options.width,
    color: {
      dark: options.foreground,
      light: options.background,
    },
  });
}

/**
 * Triggers browser download for a canvas element as PNG.
 */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename = 'breakify-qr.png'): void {
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Triggers browser download for an SVG string.
 */
export function downloadSvgString(svgContent: string, filename = 'breakify-qr.svg'): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports a QR code as a PDF document with branded title and attribution footer.
 */
export function downloadQrAsPdf(
  canvas: HTMLCanvasElement,
  title: string,
  targetUrl: string,
  filename = 'breakify-qr.pdf'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Monochrome Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(24, 24, 27); // Zinc 900
  doc.text('BreakIfy QR Code', pageWidth / 2, 35, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(113, 113, 122); // Zinc 500
  doc.text(title || 'Dynamic Short URL', pageWidth / 2, 45, { align: 'center' });

  // Add QR Image centered
  const qrDataUrl = canvas.toDataURL('image/png');
  const qrSize = 100; // 100mm x 100mm
  const x = (pageWidth - qrSize) / 2;
  const y = 60;
  doc.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);

  // Target URL box
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(82, 82, 91);
  doc.text(targetUrl, pageWidth / 2, y + qrSize + 15, { align: 'center' });

  // Branded Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text(
    'Generated by BreakIfy (breakify.site) — Shorten. Track. Share.',
    pageWidth / 2,
    pageHeight - 20,
    { align: 'center' }
  );

  doc.save(filename);
}

/**
 * Generates and packs multiple QR codes into a single downloadable ZIP file.
 */
export async function downloadBulkQrZip(
  items: Array<{ title: string; shortCode: string; targetUrl: string }>,
  options: QrCustomization,
  zipFilename = 'breakify-qr-bundle.zip',
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('breakify-qr-codes');
  const tempCanvas = document.createElement('canvas');

  let done = 0;
  for (const item of items) {
    await renderQrToCanvas(tempCanvas, item.targetUrl, options);
    const dataUrl = tempCanvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const safeName = (item.shortCode || 'qr').replace(/[^a-zA-Z0-9_-]/g, '_');
    folder?.file(`${safeName}.png`, base64Data, { base64: true });
    done++;
    if (onProgress) onProgress(done, items.length);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

