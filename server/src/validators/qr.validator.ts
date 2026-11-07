import { z } from 'zod';
import { validateQrContrast } from '../utils/qr.util.js';

export const qrGenerateSchema = z
  .object({
    text: z.string().min(1, 'Text or URL is required').max(2048),
    format: z.enum(['dataurl', 'svg', 'png']).default('dataurl'),
    errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).default('M'),
    margin: z.number().int().min(0).max(10).default(2),
    width: z.number().int().min(128).max(4096).default(512),
    colorDark: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color for foreground')
      .default('#000000'),
    colorLight: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color for background')
      .default('#ffffff'),
  })
  .refine(
    (data) => {
      const contrast = validateQrContrast(data.colorDark, data.colorLight);
      return contrast.isReadable;
    },
    {
      message: 'Color contrast between foreground and background is too low for reliable QR scanning (minimum 3.0:1 required).',
      path: ['colorDark'],
    }
  );

