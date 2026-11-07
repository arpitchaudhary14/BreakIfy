import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// All analytics routes require authentication
router.use(requireAuth);

router.get('/overview', (req, res, next) => {
  analyticsController.getOverview(req, res, next).catch(next);
});

router.get('/timeseries', (req, res, next) => {
  analyticsController.getTimeSeries(req, res, next).catch(next);
});

router.get('/breakdowns', (req, res, next) => {
  analyticsController.getBreakdowns(req, res, next).catch(next);
});

router.get('/events', (req, res, next) => {
  analyticsController.getRecentEvents(req, res, next).catch(next);
});

router.get('/export', (req, res, next) => {
  analyticsController.exportCsv(req, res, next).catch(next);
});

export default router;
