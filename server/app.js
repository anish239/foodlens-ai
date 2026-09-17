import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './routes/apiRoutes.js';
import { notFoundMiddleware } from './middleware/notFoundMiddleware.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimitMiddleware.js';
import { requestIdMiddleware } from './middleware/requestIdMiddleware.js';
import connectDB from './config/db.js';

const app = express();

// Trust reverse proxy (e.g. Cloud Run, Nginx) for rate-limiting and secure headers
app.set('trust proxy', 1);

// Attach Request Correlation ID
app.use(requestIdMiddleware);

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // CSP managed at reverse proxy/hosting layer if required
    crossOriginEmbedderPolicy: false,
  })
);

// Production-hardened CORS Configuration
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy does not allow access from this origin'));
    }

    // Development allows all origins or localhost
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  credentials: true,
  maxAge: 86400, // 24 hours pre-flight caching
};

app.use(cors(corsOptions));

// Request Logging (without logging sensitive credentials or tokens)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  // Custom combined format that includes correlation ID
  morgan.token('id', (req) => req.id || '-');
  app.use(morgan(':id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'));
}

// JSON Body Parser with bounded size limit (10kb) to prevent DoS
app.use(express.json({ limit: '10kb' }));

// URL normalization middleware for Vercel Serverless Functions & reverse proxies
app.use((req, res, next) => {
  // If Vercel or proxy rewrite transformed req.url to destination (/api or /api/index.js or /)
  // but req.originalUrl contains the actual client path
  if (req.originalUrl && req.originalUrl.startsWith('/api') && (!req.url || !req.url.startsWith('/api') || req.url === '/api' || req.url === '/api/index.js')) {
    req.url = req.originalUrl;
  }
  // Strip duplicate /api/api if accidental double prefix occurs
  if (req.url && req.url.startsWith('/api/api/')) {
    req.url = req.url.replace('/api/api/', '/api/');
  }
  next();
});

// Serverless database connection middleware ensuring connection before route execution
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request handler:', err.message);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        success: false,
        message: 'Database connection failure. Please verify MONGODB_URI configuration in Vercel.',
        error: { code: 'DATABASE_ERROR' },
      });
    }
    next(err);
  }
});

// Global Rate Limiting on API routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api', apiRoutes);

// API 404 & Error Handling for /api routes only
app.use('/api', notFoundMiddleware);
app.use('/api', errorMiddleware);

export default app;
