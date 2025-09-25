/**
 * Configuration for different environments
 * Centralizes all environment-specific settings
 */
const environments = {
  development: {
    server: {
      port: process.env.PORT || 3001,
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        credentials: true
      }
    },
    browser: {
      headless: false,
      devtools: true,
      timeout: 30000,
      viewport: { width: 1366, height: 768 }
    },
    security: {
      bcryptRounds: 10,
      jwtExpiresIn: '24h',
      rateLimitWindow: 15 * 60 * 1000, // 15 minutes
      rateLimitMax: 100
    },
    logging: {
      level: 'debug',
      includeStackTrace: true
    }
  },
  
  production: {
    server: {
      port: process.env.PORT || 8080,
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
        credentials: true
      }
    },
    browser: {
      headless: true,
      devtools: false,
      timeout: 60000,
      viewport: { width: 1366, height: 768 }
    },
    security: {
      bcryptRounds: 12,
      jwtExpiresIn: '2h',
      rateLimitWindow: 15 * 60 * 1000, // 15 minutes
      rateLimitMax: 20
    },
    logging: {
      level: 'error',
      includeStackTrace: false
    }
  },
  
  testing: {
    server: {
      port: 3001,
      cors: {
        origin: 'http://localhost:3000',
        credentials: true
      }
    },
    browser: {
      headless: true,
      devtools: false,
      timeout: 20000,
      viewport: { width: 1024, height: 768 }
    },
    security: {
      bcryptRounds: 8,
      jwtExpiresIn: '1h',
      rateLimitWindow: 5 * 60 * 1000, // 5 minutes
      rateLimitMax: 50
    },
    logging: {
      level: 'info',
      includeStackTrace: true
    }
  }
};

// Get current environment
const env = process.env.NODE_ENV || 'development';

// Validate environment
if (!environments[env]) {
  throw new Error(`Invalid environment: ${env}. Must be one of: ${Object.keys(environments).join(', ')}`);
}

const config = environments[env];

// Add global configuration
config.global = {
  environment: env,
  jwtSecret: process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-min-32-chars',
  encryption: {
    algorithm: 'aes-256-cbc',
    keyLength: 32
  },
  upes: {
    portalUrl: 'https://myupes-beta.upes.ac.in/oneportal/app/auth/login',
    maxRetries: 3,
    retryDelay: 2000,
    sessionTimeout: 300000 // 5 minutes
  },
  cache: {
    attendanceTTL: 300000, // 5 minutes
    maxCacheSize: 100
  }
};

// Validation functions
config.validate = {
  jwtSecret: () => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.warn('Warning: JWT_SECRET should be at least 32 characters long');
    }
  },
  
  environment: () => {
    const requiredVars = ['JWT_SECRET'];
    const missing = requiredVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
    }
  },
  
  security: () => {
    if (env === 'production') {
      if (config.security.bcryptRounds < 12) {
        console.warn('Warning: bcryptRounds should be at least 12 in production');
      }
      
      if (config.browser.headless !== true) {
        console.warn('Warning: Browser should run in headless mode in production');
      }
    }
  }
};

// Run validations
Object.values(config.validate).forEach(fn => fn());

module.exports = config;