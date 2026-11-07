import { Request, Response, NextFunction } from 'express';
import { Link } from '../models/Link.model.js';
import {
  generateQrDataUrl,
  generateQrSvg,
  generateQrPngBuffer,
  validateQrContrast,
} from '../utils/qr.util.js';
import { AppError } from '../utils/AppError.js';
import { QRCodeErrorCorrectionLevel } from 'qrcode';
import { activityService } from '../services/activity.service.js';

export class QrController {
  async generateQr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        text,
        format = 'dataurl',
        errorCorrectionLevel = 'M',
        margin = 2,
        width = 512,
        colorDark = '#000000',
        colorLight = '#ffffff',
      } = req.body;

      const contrast = validateQrContrast(colorDark, colorLight);
      if (!contrast.isReadable) {
        throw new AppError(contrast.warning || 'Insufficient QR color contrast.', 400);
      }

      const options = {
        errorCorrectionLevel: errorCorrectionLevel as QRCodeErrorCorrectionLevel,
        margin: Number(margin),
        width: Number(width),
        color: {
          dark: colorDark,
          light: colorLight,
        },
      };

      if (format === 'svg') {
        const svg = await generateQrSvg(text, options);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(200).send(svg);
        return;
      }

      if (format === 'png') {
        const buffer = await generateQrPngBuffer(text, options);
        res.setHeader('Content-Type', 'image/png');
        res.status(200).send(buffer);
        return;
      }

      const dataUrl = await generateQrDataUrl(text, options);

      if (req.user) {
        await activityService.logActivity({
          userId: req.user._id.toString(),
          action: 'QR_GENERATE',
          category: 'qr',
          description: `Generated custom QR code for: ${text.slice(0, 50)}`,
          metadata: { format, errorCorrectionLevel, width },
        });
      }

      res.status(200).json({
        success: true,
        data: {
          dataUrl,
          contrastRatio: contrast.ratio,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getLinkQr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { linkId } = req.params;
      const {
        format = 'png',
        download = 'false',
        colorDark = '#000000',
        colorLight = '#ffffff',
        errorCorrectionLevel = 'M',
        margin = 2,
        width = 512,
      } = req.query;

      const link = await Link.findById(linkId);
      if (!link) {
        throw new AppError('Link not found', 404);
      }

      // Append ?src=qr to enable accurate attribution
      const qrTargetUrl = `https://breakify.site/${link.shortCode}?src=qr`;

      const options = {
        errorCorrectionLevel: (errorCorrectionLevel as QRCodeErrorCorrectionLevel) || 'M',
        margin: Number(margin),
        width: Number(width),
        color: {
          dark: String(colorDark),
          light: String(colorLight),
        },
      };

      if (format === 'svg') {
        const svg = await generateQrSvg(qrTargetUrl, options);
        res.setHeader('Content-Type', 'image/svg+xml');
        if (download === 'true') {
          res.setHeader('Content-Disposition', `attachment; filename="breakify-${link.shortCode}-qr.svg"`);
        }
        res.status(200).send(svg);
        return;
      }

      const buffer = await generateQrPngBuffer(qrTargetUrl, options);
      res.setHeader('Content-Type', 'image/png');
      if (download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="breakify-${link.shortCode}-qr.png"`);
      }
      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export const qrController = new QrController();

