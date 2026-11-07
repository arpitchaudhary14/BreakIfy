import { Router } from 'express';
import { abuseController } from '../controllers/abuse.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { abuseReportLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Public abuse report submission with rate limiter
router.post('/report', abuseReportLimiter, abuseController.submitReport.bind(abuseController));

// Admin review endpoints
router.get('/reports', requireAuth, abuseController.listReports.bind(abuseController));
router.patch('/reports/:reportId', requireAuth, abuseController.resolveReport.bind(abuseController));

export default router;
