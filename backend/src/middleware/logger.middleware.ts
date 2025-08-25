import morgan from 'morgan';
import { Request, Response } from 'express';
import { config } from '../config/server';
import logger from '../utils/logger';

// Custom Morgan token for response time in ms
morgan.token('response-time-ms', (req, res) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '0ms';
});

// Custom format for development
const developmentFormat = ':method :url :status :res[content-length] - :response-time ms';

// Custom format for production
const productionFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Create Morgan logger instance
export const requestLogger = morgan(
  config.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  {
    stream: {
      write: (message: string) => {
        // Remove trailing newline and log via Winston
        logger.info(message.trim());
      },
    },
    skip: (req, res) => {
      // Skip logging for health check endpoints in production
      if (config.NODE_ENV === 'production') {
        return req.url === '/health' || req.url === '/api/health';
      }
      return false;
    },
  }
); 