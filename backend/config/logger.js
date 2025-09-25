/**
 * Centralized logger for the application
 * Provides structured logging with different levels and formats
 */
const config = require('./environment');

class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = this.levels[config.logging.level] || this.levels.info;
    this.includeStackTrace = config.logging.includeStackTrace;
  }
  
  /**
   * Format log message with timestamp and level
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      environment: config.global.environment
    };
    
    if (data) {
      if (data instanceof Error) {
        logEntry.error = {
          name: data.name,
          message: data.message
        };
        
        if (this.includeStackTrace) {
          logEntry.error.stack = data.stack;
        }
      } else {
        logEntry.data = this.sanitizeData(data);
      }
    }
    
    return JSON.stringify(logEntry, null, 2);
  }
  
  /**
   * Sanitize sensitive data from logs
   */
  sanitizeData(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  /**
   * Check if message should be logged based on current level
   */
  shouldLog(level) {
    return this.levels[level] <= this.currentLevel;
  }
  
  /**
   * Log error message
   */
  error(message, data = null) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }
  
  /**
   * Log warning message
   */
  warn(message, data = null) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }
  
  /**
   * Log info message
   */
  info(message, data = null) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data));
    }
  }
  
  /**
   * Log debug message
   */
  debug(message, data = null) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data));
    }
  }
  
  /**
   * Log security-related events
   */
  security(event, details = null) {
    const securityLog = {
      type: 'SECURITY_EVENT',
      event,
      details: this.sanitizeData(details),
      timestamp: new Date().toISOString(),
      environment: config.global.environment
    };
    
    console.warn(JSON.stringify(securityLog, null, 2));
  }
  
  /**
   * Log HTTP requests (middleware-friendly)
   */
  httpRequest(req, res, responseTime) {
    if (!this.shouldLog('info')) return;
    
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    // Add user info if available
    if (req.user) {
      logData.userId = req.user.id;
    }
    
    this.info('HTTP Request', logData);
  }
  
  /**
   * Log scraping operations
   */
  scraping(operation, details = null) {
    this.info(`Scraping: ${operation}`, this.sanitizeData(details));
  }
  
  /**
   * Log performance metrics
   */
  performance(operation, duration, details = null) {
    const perfLog = {
      operation,
      duration: `${duration}ms`,
      details: this.sanitizeData(details)
    };
    
    this.info('Performance', perfLog);
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;