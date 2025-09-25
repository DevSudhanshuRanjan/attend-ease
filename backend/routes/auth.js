const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
    code: 'TOO_MANY_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateLoginInput = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('User ID must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9._@-]+$/)
    .withMessage('User ID contains invalid characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials (validation only, no actual login)
 * @access  Public
 */
router.post('/login', loginLimiter, validateLoginInput, asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Invalid input data',
      details: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }

  const { userId, password } = req.body;

  // Input sanitization
  const sanitizedUserId = userId.trim().toLowerCase();
  const sanitizedPassword = password.trim();

  // Basic validation
  if (!sanitizedUserId || !sanitizedPassword) {
    return res.status(400).json({
      error: 'User ID and password are required',
      code: 'MISSING_CREDENTIALS'
    });
  }

  // For this implementation, we'll just validate the format and return a token
  // The actual UPES login validation happens during attendance fetching
  // This approach is more secure as we don't store credentials

  try {
    // Generate a session token with email
    const payload = {
      userId: sanitizedUserId,
      email: sanitizedUserId, // Use userId as email for demo
      loginTime: Date.now(),
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
    };

    const token = generateToken(payload);

    // Log successful login attempt (without password)
    console.log(`Login attempt for user: ${sanitizedUserId} at ${new Date().toISOString()}`);

    res.status(200).json({
      success: true,
      message: 'Login credentials validated',
      token,
      user: {
        userId: sanitizedUserId,
        loginTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Login processing error:', error);
    res.status(500).json({
      error: 'Login processing failed',
      code: 'LOGIN_ERROR'
    });
  }
}));

/**
 * @route   POST /api/auth/validate
 * @desc    Validate JWT token
 * @access  Public
 */
router.post('/validate', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      error: 'Token is required',
      code: 'NO_TOKEN'
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.status(200).json({
      valid: true,
      user: {
        userId: decoded.userId,
        loginTime: new Date(decoded.loginTime).toISOString(),
        sessionId: decoded.sessionId
      }
    });

  } catch (error) {
    let errorMessage = 'Invalid token';
    let errorCode = 'INVALID_TOKEN';

    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token expired';
      errorCode = 'TOKEN_EXPIRED';
    }

    res.status(401).json({
      valid: false,
      error: errorMessage,
      code: errorCode
    });
  }
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token cleanup)
 * @access  Public
 */
router.post('/logout', asyncHandler(async (req, res) => {
  // Since we're using JWT tokens, logout is handled client-side by removing the token
  // Here we just acknowledge the logout request
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`User ${decoded.userId} logged out at ${new Date().toISOString()}`);
    } catch (error) {
      // Token might be invalid/expired, but that's okay for logout
    }
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
}));

/**
 * @route   GET /api/auth/session-info
 * @desc    Get current session information
 * @access  Private
 */
router.get('/session-info', require('../middleware/auth').authenticateToken, asyncHandler(async (req, res) => {
  const user = req.user;
  
  res.status(200).json({
    success: true,
    session: {
      userId: user.userId,
      loginTime: new Date(user.loginTime).toISOString(),
      sessionId: user.sessionId,
      tokenIssuedAt: new Date(user.iat * 1000).toISOString(),
      tokenExpiresAt: new Date(user.exp * 1000).toISOString()
    }
  });
}));

module.exports = router;