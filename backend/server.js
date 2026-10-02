import express from 'express';
import cors from 'cors';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { apiLimiter } from './middleware/rateLimiter.js';

dotenv.config();

import authRoutes from './routes/authRoutes.js';
import houseRoutes from './routes/houseRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import seekingAdRoutes from './routes/seekingAdRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import rentalContractRoutes from './routes/rentalContractRoutes.js';
import rentalReminderRoutes from './routes/rentalReminderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import propertyAlertRoutes from './routes/propertyAlertRoutes.js';
import smsRoutes from './routes/smsRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import heroSlideRoutes from './routes/heroSlideRoutes.js';
import tickerRoutes from './routes/tickerRoutes.js';
import aboutRoutes from './routes/aboutRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import authPageRoutes from './routes/authPageRoutes.js';
import { testConnection, getPool, validateProductionSecrets } from '../database/db.js';
import { securityAuditLog, checkLoginLockout } from './middleware/securityMiddleware.js';
import { generateRequestId } from './middleware/requestId.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 5002);

  // Initialize database before starting server
  await testConnection();

  // Validate production secrets
  if (!validateProductionSecrets()) {
    console.error('[STARTUP] Application startup aborted due to missing or invalid production configuration.');
    process.exit(1);
  }

  const trustProxy = Number(process.env.TRUST_PROXY || 1);
  app.set('trust proxy', trustProxy);
  app.disable('x-powered-by');

  // Request correlation ID middleware
  app.use((req, res, next) => {
    const requestId = generateRequestId();
    req.id = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  });

  // Compress HTTP responses for high throughput under heavy traffic
  app.use(compression());

  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Security headers
  const isDev = process.env.NODE_ENV !== 'production';
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: isDev
          ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
          : ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5173"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "data:"],
        frameSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true }
  }));

  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    next();
  });

  // Restrictive CORS
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  app.use(cors({
    origin: [clientUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use('/api', apiLimiter);

  // CSRF protection middleware
  app.use((req, res, next) => {
    const csrfToken = req.cookies?.csrfToken || req.headers['x-csrf-token'];
    
    // Skip CSRF check for GET, HEAD, OPTIONS requests and public API routes
    const publicPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/admin-login',
      '/api/auth/admin/verify-credentials',
      '/api/auth/admin/send-2fa',
      '/api/auth/admin/verify-2fa',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/settings',
      '/api/houses',
      '/api/houses/',
      '/api/requests',
      '/api/requests/',
      '/api/messages',
      '/api/messages/',
      '/api/testimonials',
      '/api/testimonials/',
      '/api/seeking-ads',
      '/api/seeking-ads/',
      '/api/payments/config',
      '/api/payments/accounts',
      '/api/announcements',
      '/api/announcements/',
      '/api/hero-slides',
      '/api/hero-slides/',
      '/api/ticker',
      '/api/ticker/',
      '/api/about',
      '/api/about/',
      '/api/contact',
      '/api/contact/',
      '/api/auth-page',
      '/api/auth-page/',
      '/api/reviews',
      '/api/reviews/',
      '/api/health',
      '/api/sms/webhook'
    ];
    const isPublicPath = publicPaths.some(path => req.path === path || req.path.startsWith(path));
    
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || isPublicPath) {
      return next();
    }

    // Bearer-authenticated requests are not vulnerable to CSRF because
    // browsers cannot automatically attach Authorization headers to
    // cross-origin requests.
    const hasBearerAuth = typeof req.headers.authorization === 'string' &&
                          req.headers.authorization.toLowerCase().startsWith('bearer ');
    if (hasBearerAuth) {
      return next();
    }
    
    // For state-changing requests without Bearer auth, require CSRF token
    if (!csrfToken) {
      return res.status(403).json({ error: 'CSRF token missing' });
    }

    // Generate new CSRF token for response if not present
    if (!req.cookies?.csrfToken) {
      const newCsrfToken = randomBytes(32).toString('hex');
      res.cookie('csrfToken', newCsrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });
    }

    next();
  });

  // Ensure uploads directory exists
// AletCloud/container environments may not allow writing to /app,
// so use /tmp for runtime-writable temporary storage.
const uploadsDir = path.join('/tmp', 'injibara-house-rental-uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Protected uploads middleware - allow public read for images,
// require auth for sensitive files
const protectedUploads = (req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  const sensitiveExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

  if (sensitiveExtensions.includes(ext)) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required for this file'
      });
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        return res.status(500).json({
          error: 'Server configuration error'
        });
      }

      jwt.verify(token, jwtSecret, {
        algorithms: ['HS256']
      });
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }
  }

  next();
};

app.use(
  '/uploads',
  protectedUploads,
  express.static(uploadsDir)
);

// API Routes
app.get('/api/health', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'unavailable'
    });
  }
});

  // Dynamic SEO Sitemap for Google Search Indexing
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const publicBaseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
      const baseUrl = publicBaseUrl.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      let houses = [];
      try {
        const pool = getPool();
        const [rows] = await pool.query("SELECT house_id, created_at FROM houses WHERE status = 'Available'");
        houses = rows || [];
      } catch (err) {
        // Fallback if DB query fails
      }

      const houseUrls = houses.map(h => {
        const houseUrl = `${baseUrl}/houses/${h.house_id}`;
        return `
  <url>
    <loc>${houseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
      }).join('');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/houses</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>${houseUrls}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (e) {
      res.status(500).end();
    }
  });

  // SEO Robots.txt for Search Engines
  app.get('/robots.txt', (req, res) => {
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard

Sitemap: ${publicBaseUrl}/sitemap.xml`);
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/houses', houseRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/settings', settingRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/testimonials', testimonialRoutes);
  app.use('/api/seeking-ads', seekingAdRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api', reviewRoutes);
  app.use('/api/contracts', rentalContractRoutes);
  app.use('/api/rent-reminders', rentalReminderRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/alerts', propertyAlertRoutes);
  app.use('/api/sms', smsRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/hero-slides', heroSlideRoutes);
  app.use('/api/ticker', tickerRoutes);
  app.use('/api/about', aboutRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/auth-page', authPageRoutes);

  // Global Error Handler Middleware
  app.use((err, req, res, next) => {
    const requestId = req.id || 'unknown';
    if (process.env.NODE_ENV === 'production') {
      console.error(`[${requestId}] Unhandled System Error:`, err.message);
    } else {
      console.error(`[${requestId}] Unhandled System Error:`, err.stack || err);
    }
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production' 
        ? 'An unexpected server error occurred. Please try again later.' 
        : (err.message || 'Internal Server Error'),
      requestId: process.env.NODE_ENV !== 'production' ? requestId : undefined
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    
    // Serve static files with long-term caching for assets
    app.use(express.static(distPath, {
      maxAge: '1y',
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          // Do not cache HTML files long-term to ensure users get the latest version
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (path.includes('/assets/')) {
          // Cache hashed assets for 1 year
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the existing server or set PORT to a free port.`);
      process.exit(1);
    }

    console.error('Server startup error:', error);
    process.exit(1);
  });

  let isShuttingDown = false;

  const gracefulShutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`Received ${signal}. Starting graceful shutdown...`);

    server.close(async () => {
      try {
        const pool = getPool();
        if (pool && typeof pool.release === 'function') {
          pool.release();
        }
        console.log('Graceful shutdown complete.');
        process.exit(0);
      } catch (error) {
        console.error('Shutdown error:', error.message);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.message);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    gracefulShutdown('unhandledRejection');
  });
}
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
