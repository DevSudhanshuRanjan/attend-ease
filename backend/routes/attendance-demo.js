const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Rate limiting for attendance fetching
const attendanceLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Allow more attempts for demo
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
 * @desc    Fetch attendance data (Demo version with mock data)
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

    try {
      console.log(`Demo attendance fetch for user: ${userId}`);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Return mock attendance data that matches frontend expectations
      const mockAttendanceData = {
        success: true,
        student: {
          name: "Demo Student",
          studentId: userId,
          course: "B.Tech CSE",
          semester: "Semester 3",
          status: "ACTIVE"
        },
        attendance: [
          {
            subject: "Discrete Mathematical Structures",
            subjectCode: "CSBT301",
            totalClasses: 16,
            attendedClasses: 14,
            attendancePercentage: 87.5,
            status: "Good",
            faculty: "Dr. Smith"
          },
          {
            subject: "Operating Systems",
            subjectCode: "CSBT302", 
            totalClasses: 19,
            attendedClasses: 17,
            attendancePercentage: 89.47,
            status: "Good", 
            faculty: "Prof. Johnson"
          },
          {
            subject: "Database Management Systems",
            subjectCode: "CSBT303",
            totalClasses: 23,
            attendedClasses: 21,
            attendancePercentage: 91.3,
            status: "Excellent",
            faculty: "Dr. Williams"
          },
          {
            subject: "Design and Analysis of Algorithms",
            subjectCode: "CSBT304",
            totalClasses: 24,
            attendedClasses: 24,
            attendancePercentage: 100,
            status: "Perfect",
            faculty: "Prof. Brown"
          },
          {
            subject: "Elements of AIML",
            subjectCode: "CSBT305",
            totalClasses: 19,
            attendedClasses: 19, 
            attendancePercentage: 100,
            status: "Perfect",
            faculty: "Dr. Davis"
          }
        ],
        overallAttendance: {
          totalClasses: 101,
          attendedClasses: 95,
          overallPercentage: 94.06,
          status: "Excellent"
        },
        metadata: {
          requestedBy: userId,
          requestTime: new Date().toISOString(),
          source: 'DEMO - UPES Beta Portal Simulation',
          version: '1.0',
          note: 'This is demo data. Real scraping requires browser support on the server.'
        }
      };

      console.log(`Demo attendance fetch successful for user: ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Attendance data fetched successfully (Demo Mode)',
        data: mockAttendanceData
      });

    } catch (error) {
      console.error(`Demo attendance fetch failed for user ${userId}:`, error.message);

      res.status(500).json({
        success: false,
        error: 'Failed to fetch attendance data',
        code: 'DEMO_ERROR',
        details: error.message
      });
    }
  })
);

/**
 * @route   GET /api/attendance/status
 * @desc    Get attendance service status
 * @access  Public
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Attendance service is running in demo mode',
    features: {
      browserScraping: false,
      demoData: true,
      realTimeData: false
    },
    note: 'Browser-based scraping is not available on this deployment platform. Demo data is provided for testing.'
  });
});

module.exports = router;