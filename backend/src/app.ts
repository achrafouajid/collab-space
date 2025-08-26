import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { config } from './config/server';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/error.middleware';
import { setCacheHeaders, conditionalRequest, cacheMiddleware } from './middleware/caching.middleware';
import { ResponseUtil } from './utils/response';

// Import route modules
import userRoutes from './modules/user/router';
import productRoutes from './modules/product/router';
import orderRoutes from './modules/order/router';
import authRoutes from './modules/auth/router/auth.router';
import dashboardRoutes from './modules/dashboard/router/dashboard.router';
import syncRoutes from './modules/sync/router/sync.router';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow offline support
}));

// CORS configuration with offline support
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'If-Modified-Since',
    'If-None-Match',
    'Cache-Control',
    'X-Offline-Support'
  ],
  exposedHeaders: [
    'ETag',
    'Last-Modified',
    'Cache-Control',
    'X-Cache-Timestamp',
    'X-Sync-Timestamp',
    'X-Has-More',
    'X-Accepted-Count',
    'X-Rejected-Count'
  ]
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for sync health checks
  skip: (req) => req.path === '/api/v1/sync/health',
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware for better offline performance
app.use(compression({
  threshold: 1024, // Only compress responses > 1KB
  level: 6, // Balance between compression ratio and speed
  filter: (req, res) => {
    // Don't compress if cache-control says no-transform
    if (res.getHeader('Cache-Control')?.toString().includes('no-transform')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Add conditional request support for all routes
app.use(conditionalRequest());

// Logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  ResponseUtil.success(res, {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
  }, 'Server is healthy');
});

// API routes
const apiRouter = express.Router();

// Apply caching middleware to API routes
apiRouter.use(setCacheHeaders({
  maxAge: 300, // 5 minutes default cache
  mustRevalidate: true,
  etag: true,
  lastModified: true
}));

// Mount module routes with appropriate caching
apiRouter.use('/auth', cacheMiddleware.noCache(), authRoutes);
apiRouter.use('/sync', syncRoutes); // Sync routes handle their own caching
apiRouter.use('/users', cacheMiddleware.shortCache(), userRoutes);
apiRouter.use('/dashboard', cacheMiddleware.mediumCache(), dashboardRoutes);
apiRouter.use('/products', cacheMiddleware.mediumCache(), productRoutes);
apiRouter.use('/orders', cacheMiddleware.shortCache(), orderRoutes);

// Mount API routes with version prefix
app.use(`/api/${config.API_VERSION}`, apiRouter);

// Swagger documentation
if (config.SWAGGER_ENABLED) {
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'PERN Stack API with Offline Support',
        version: '1.0.0',
        description: 'A comprehensive PERN stack API with TypeScript and offline synchronization',
        contact: {
          name: 'API Support',
          email: 'support@example.com',
        },
      },
      servers: [
        {
          url: `http://localhost:${config.PORT}/api/${config.API_VERSION}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        {
          name: 'Sync',
          description: 'Offline synchronization endpoints',
        },
        {
          name: 'Auth',
          description: 'Authentication endpoints',
        },
        {
          name: 'Users',
          description: 'User management',
        },
        {
          name: 'Dashboard',
          description: 'Dashboard and analytics',
        },
        {
          name: 'Products',
          description: 'Product management',
        },
        {
          name: 'Orders',
          description: 'Order management',
        },
      ],
    },
    apis: [
      './src/modules/*/router/*.ts', 
      './src/modules/*/*.ts',
      './src/modules/*/controller/*.ts'
    ],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  
  // Cache swagger documentation
  app.use('/api-docs', 
    cacheMiddleware.longCache(), 
    swaggerUi.serve, 
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: 'PERN API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
    })
  );
}

// Service Worker support - serve service worker from root
app.get('/sw.js', cacheMiddleware.noCache(), (req, res) => {
  res.type('application/javascript');
  res.send(`
    // Basic service worker for PWA support
    console.log('Service Worker: PWA support enabled');
    
    self.addEventListener('fetch', function(event) {
      // Let the browser handle all fetch events
      // Custom caching logic can be added here
    });
  `);
});

// PWA manifest endpoint
app.get('/manifest.json', cacheMiddleware.longCache(), (req, res) => {
  const manifest = {
    name: 'PERN Stack App',
    short_name: 'PERN App',
    description: 'Progressive Web App with offline support',
    start_url: '/',
    display: 'standalone',
    theme_color: '#000000',
    background_color: '#ffffff',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icon-512x512.png', 
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any'
      }
    ]
  };
  
  res.json(manifest);
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  ResponseUtil.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
});

app.use(errorHandler);

export default app;