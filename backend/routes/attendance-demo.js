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

      // Return comprehensive mock attendance data matching UPES portal structure
      const mockAttendanceData = {
        success: true,
        student: {
          name: "Anvesha Tyagi",
          studentId: "590018435",
          course: "B.Tech CSE",
          semester: "Semester 3",
          status: "ACTIVE",
          profilePhoto: "https://via.placeholder.com/150x150/4A90E2/FFFFFF?text=AT"
        },
        attendance: [
          {
            subject: "Discrete Mathematical Structures",
            subjectCode: "CSBT301",
            total: 16,
            attended: 14,
            percentage: 87.5,
            status: "Good",
            faculty: "Dr. Smith"
          },
          {
            subject: "Operating Systems",
            subjectCode: "CSBT302", 
            total: 19,
            attended: 17,
            percentage: 89.47,
            status: "Good", 
            faculty: "Prof. Johnson"
          },
          {
            subject: "Database Management Systems",
            subjectCode: "CSBT303",
            total: 23,
            attended: 21,
            percentage: 91.3,
            status: "Excellent",
            faculty: "Dr. Williams"
          },
          {
            subject: "Design and Analysis of Algorithms",
            subjectCode: "CSBT304",
            total: 24,
            attended: 24,
            percentage: 100,
            status: "Perfect",
            faculty: "Prof. Brown"
          },
          {
            subject: "Elements of AIML",
            subjectCode: "CSBT305",
            total: 20,
            attended: 19, 
            percentage: 95.0,
            status: "Excellent",
            faculty: "Dr. Davis"
          },
          {
            subject: "Fundamentals of Clinical Research",
            subjectCode: "HSBT206",
            total: 12,
            attended: 12,
            percentage: 100,
            status: "Perfect",
            faculty: "Dr. Sharma"
          },
          {
            subject: "Histories of Environment",
            subjectCode: "HSBT207",
            total: 4,
            attended: 4,
            percentage: 100,
            status: "Perfect",
            faculty: "Prof. Kumar"
          },
          {
            subject: "Biomedical Diagnostics",
            subjectCode: "HSBT208",
            total: 6,
            attended: 5,
            percentage: 83.33,
            status: "Good",
            faculty: "Dr. Patel"
          },
          {
            subject: "Computer Networks",
            subjectCode: "CSBT306",
            total: 18,
            attended: 15,
            percentage: 83.33,
            status: "Good",
            faculty: "Prof. Singh"
          },
          {
            subject: "Software Engineering",
            subjectCode: "CSBT307",
            total: 20,
            attended: 16,
            percentage: 80.0,
            status: "Good",
            faculty: "Dr. Gupta"
          }
        ],
        overallAttendance: {
          totalClasses: 142,
          attendedClasses: 127,
          overallPercentage: 89.44,
          status: "Excellent",
          totalSubjects: 10,
          safeSubjects: 8,
          warningSubjects: 2,
          criticalSubjects: 0,
          recommendations: [
            "Excellent! All subjects have safe attendance.",
            "Keep up the great work and maintain regular class attendance.",
            "Focus on Computer Networks and Software Engineering to improve further."
          ]
        },
        metadata: {
          requestedBy: userId,
          requestTime: new Date().toISOString(),
          source: 'Enhanced Demo - UPES Beta Portal Simulation',
          version: '2.0',
          lastUpdated: 'Jan 25, 2025 10:14 PM',
          note: 'This is enhanced demo data matching the real UPES portal structure.'
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