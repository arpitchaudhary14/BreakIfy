import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import linkRouter from './link.routes.js';
import qrRouter from './qr.routes.js';
import analyticsRouter from './analytics.routes.js';
import activityRouter from './activity.routes.js';
import notificationRouter from './notification.routes.js';
import abuseRouter from './abuse.routes.js';

const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/links', linkRouter);
apiRouter.use('/qr', qrRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/activity', activityRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/abuse', abuseRouter);

export default apiRouter;
