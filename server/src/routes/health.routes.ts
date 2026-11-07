import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../config/db.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'BreakIfy API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
    },
  });
});

export default router;

