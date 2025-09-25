const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const UPESScrapingService = require('../services/upesScrapingService');

const router = express.Router();

// Rate limiting for attendance fetching
const attendanceLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // limit each IP to 3 attendance fetch requests per windowMs
  message: {
    error: 'Too many attendance fetch attempts, please try again later.',
    code: 'TOO_MANY_FETCH_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware for attendance fetching
const validateAttendanceInput = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty'),
];

/**
 * @route   POST /api/attendance/fetch
 * @desc    Fetch attendance data from UPES Beta Portal
 * @access  Private
 */
router.post('/fetch', 
  authenticateToken, 
  attendanceLimiter, 
  validateAttendanceInput, 
  asyncHandler(async (req, res) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Invalid input data',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { password } = req.body;
    const userId = req.user.userId; // From JWT token

    if (!password || !userId) {
      return res.status(400).json({
        error: 'User ID and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const scrapingService = new UPESScrapingService();

    try {
      console.log(`Starting attendance fetch for user: ${userId}`);
      
      // Set a timeout for the entire operation
      const fetchTimeout = setTimeout(() => {
        throw new Error('Attendance fetch timeout - operation took too long');
      }, 120000); // 2 minutes timeout

      // Fetch attendance report
      const attendanceReport = await scrapingService.fetchAttendanceReport(userId, password);
      
      clearTimeout(fetchTimeout);

      // Add request metadata
      attendanceReport.metadata = {
        requestedBy: userId,
        requestTime: new Date().toISOString(),
        source: 'UPES Beta Portal',
        version: '1.0'
      };

      console.log(`Attendance fetch successful for user: ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Attendance data fetched successfully',
        data: attendanceReport
      });

    } catch (error) {
      console.error(`Attendance fetch failed for user ${userId}:`, error.message);

      // Determine appropriate error response
      let statusCode = 500;
      let errorCode = 'FETCH_ERROR';
      let errorMessage = 'Failed to fetch attendance data';

      if (error.message.includes('Login failed') || error.message.includes('credentials')) {
        statusCode = 401;
        errorCode = 'INVALID_CREDENTIALS';
        errorMessage = 'Invalid login credentials. Please check your user ID and password.';
      } else if (error.message.includes('RATE_LIMITED') || error.message.includes('too many login attempts')) {
        statusCode = 429;
        errorCode = 'RATE_LIMITED';
        errorMessage = 'Too many login attempts. Please wait 15-30 minutes before trying again.';
      } else if (error.message.includes('timeout') || error.message.includes('Network')) {
        statusCode = 504;
        errorCode = 'TIMEOUT_ERROR';
        errorMessage = 'Request timeout. Please try again later.';
      } else if (error.message.includes('Browser') || error.message.includes('puppeteer')) {
        statusCode = 503;
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (error.message.includes('No attendance data found')) {
        statusCode = 404;
        errorCode = 'NO_DATA_FOUND';
        errorMessage = 'No attendance data found. Please check if data is available on the portal.';
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        code: errorCode,
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
          stack: error.stack
        })
      });

    } finally {
      // Ensure cleanup happens even if an error occurs
      try {
        await scrapingService.cleanup();
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
  })
);

/**
 * @route   GET /api/attendance/history/:userId
 * @desc    Get attendance history for a user (if implementing caching)
 * @access  Private
 */
router.get('/history/:userId', 
  authenticateToken, 
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const requestingUser = req.user.userId;

    // Users can only access their own history
    if (userId !== requestingUser) {
      return res.status(403).json({
        error: 'Access denied. You can only access your own attendance history.',
        code: 'ACCESS_DENIED'
      });
    }

    // For now, return empty history as we're not implementing persistent storage
    // In a production app, you would fetch from a database here
    res.status(200).json({
      success: true,
      message: 'Attendance history retrieved',
      data: {
        userId,
        history: [],
        message: 'History feature not implemented. Data is fetched in real-time.'
      }
    });
  })
);

/**
 * @route   GET /api/attendance/status
 * @desc    Get service status and health check
 * @access  Public
 */
router.get('/status', asyncHandler(async (req, res) => {
  try {
    // Basic health check - try to initialize browser
    const scrapingService = new UPESScrapingService();
    await scrapingService.initBrowser();
    await scrapingService.cleanup();

    res.status(200).json({
      success: true,
      status: 'Service is operational',
      services: {
        webScraping: 'operational',
        browser: 'operational',
        upesPortal: 'not_tested'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'Service partially unavailable',
      services: {
        webScraping: 'error',
        browser: 'error',
        upesPortal: 'not_tested'
      },
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route   POST /api/attendance/test-connection
 * @desc    Test connection to UPES portal (without login)
 * @access  Private
 */
router.post('/test-connection', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const scrapingService = new UPESScrapingService();

    try {
      console.log('Testing connection to UPES portal...');
      
      await scrapingService.initBrowser();
      
      // Just try to navigate to the login page
      await scrapingService.page.goto(process.env.UPES_PORTAL_URL || 'https://beta.upes.ac.in/', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      const pageTitle = await scrapingService.page.title();
      const currentUrl = scrapingService.page.url();

      res.status(200).json({
        success: true,
        message: 'Connection to UPES portal successful',
        data: {
          portalUrl: currentUrl,
          pageTitle: pageTitle,
          connectionTime: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Connection test failed:', error);
      
      res.status(503).json({
        success: false,
        error: 'Failed to connect to UPES portal',
        code: 'CONNECTION_FAILED',
        details: error.message
      });

    } finally {
      await scrapingService.cleanup();
    }
  })
);

module.exports = router;