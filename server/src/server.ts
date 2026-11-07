import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`BreakIfy Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`Health check available at http://localhost:${env.PORT}${env.API_PREFIX}/health`);
  });

  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

