import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { linkController } from './controllers/link.controller.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { redirectLimiter, authLimiter } from './middlewares/rateLimiter.middleware.js';

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows clean inline styling for error redirect pages
  })
);

// CORS configuration (supports credentials for HTTP-only cookies)
app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Body and Cookie parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Trust proxy if in production for accurate IP detection behind load balancers
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Root health ping
app.get('/', (_req, res) => {
  res.status(200).json({
    service: 'BreakIfy API',
    status: 'online',
    version: '0.1.0',
    documentation: `${env.API_PREFIX}/health`,
  });
});

// REST API Routes
app.use(env.API_PREFIX, apiRouter);

// Password verification for protected links
app.post('/:shortCode([a-zA-Z0-9_-]{3,30})/verify-password', authLimiter, (req, res, next) => {
  linkController.verifyPassword(req, res).catch(next);
});

// Public Link Redirection (GET /:shortCode)
app.get('/:shortCode([a-zA-Z0-9_-]{3,30})', redirectLimiter, (req, res, next) => {
  linkController.handleRedirect(req, res).catch(next);
});

// Fallback 404 handler
app.use(notFoundHandler);

// Central Error Handler
app.use(errorHandler);

export default app;
