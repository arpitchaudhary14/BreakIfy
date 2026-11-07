import { Router } from 'express';
import { qrController } from '../controllers/qr.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { qrGenerateSchema } from '../validators/qr.validator.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Public or authenticated QR generation
router.post('/generate', optionalAuth, validateBody(qrGenerateSchema), (req, res, next) => {
  qrController.generateQr(req, res, next).catch(next);
});

// Quick link QR rendering
router.get('/:linkId', (req, res, next) => {
  qrController.getLinkQr(req, res, next).catch(next);
});

export default router;

