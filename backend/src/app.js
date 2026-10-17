import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import farmRoutes from './routes/farm.routes.js';
import categoryRoutes from './routes/category.routes.js';
import cropListingRoutes from './routes/cropListing.routes.js';
import offerRoutes from './routes/offer.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import deliveryRoutes from './routes/delivery.routes.js';
import adminRoutes from './routes/admin.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notificationRoutes from './routes/notification.routes.js';

dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet());

// CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Global Rate Limiting
// Production: 100 requests per 15 minutes
// Development & Testing: 2,000 requests per 15 minutes (protects server while avoiding 429 lockouts during local testing & demos)
const getGlobalRateLimitMax = () => {
  if (process.env.NODE_ENV === 'production') {
    return Number(process.env.GLOBAL_RATE_LIMIT_MAX) || 100;
  }
  return Number(process.env.GLOBAL_RATE_LIMIT_DEV_MAX) || 2000;
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req, res) => getGlobalRateLimitMax(),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', globalLimiter);

// Request Logging (Custom Morgan format ensuring passwords and tokens are never logged)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

// Body Parser (with rawBody capture for Razorpay webhook verification)
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Mount Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/crop-listings', cropListingRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/conversations', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  if (statusCode >= 500) {
    console.error('Unhandled Server Error:', err.message || err);
  }
  const isProd = process.env.NODE_ENV === 'production';
  const message = statusCode >= 500 && isProd
    ? 'Internal Server Error'
    : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
  });
});

export default app;
