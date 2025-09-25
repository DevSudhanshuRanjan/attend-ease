const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const config = require('./config/environment');
const logger = require('./config/logger');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = config.server.port;

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    logger.httpRequest(req, res, responseTime);
  });
  
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.global.environment === 'development' ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Rate limiting with enhanced logging
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindow,
  max: config.security.rateLimitMax,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.security('Rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});
app.use('/api', limiter);

// CORS configuration
app.use(cors(config.server.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints (both /health and /api/health)
const healthCheck = (req, res) => {
  const healthData = {
    success: true,
    status: 'OK', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.global.environment,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  };
  
  logger.debug('Health check requested', healthData);
  res.status(200).json(healthData);
};

app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

// 404 handler
app.use('*', (req, res) => {
  logger.warn('404 - Endpoint not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'ENDPOINT_NOT_FOUND'
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

const server = app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: config.global.environment,
    cors: config.server.cors.origin,
    healthCheck: `http://localhost:${PORT}/health`
  });
});

module.exports = app;