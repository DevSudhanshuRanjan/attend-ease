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
    const userEmail = req.user.email || req.user.userId; // Fallback to userId if email not available

    if (!password || !userId) {
      return res.status(400).json({
        error: 'User ID and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    try {
      console.log(`Dynamic attendance fetch for user: ${userEmail}`);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Dynamic student info based on actual login
      let studentName = "Student Name";
      let studentId = "590018435"; // Default
      
      if (userEmail === "sudhanshu@student.com" || userEmail.includes("sudhanshu")) {
        studentName = "Sudhanshu Ranjan";
        studentId = "590018435";
      } else if (userEmail === "demo@student.com") {
        studentName = "Demo Student";
        studentId = "500000001";
      } else {
        // Extract name from email
        const emailName = userEmail.split('@')[0];
        studentName = emailName.charAt(0).toUpperCase() + emailName.slice(1).replace(/[0-9]/g, '');
      }

      // Return comprehensive mock attendance data with REAL student data
      const mockAttendanceData = {
        success: true,
        student: {
          name: studentName,
          studentId: studentId,
          course: "B.Tech CSE",
          semester: "Semester 3",
          status: "ACTIVE",
          profilePhoto: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAIsAa8DASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCwsLL9B3NSLZnjJ7ZNaUduuAMZ+tPWHkDFfhbmfV8rKK221hxUn2TCe9aCw7lHH0qTyOORg+lQ5lcpSaEcAAc0LbhcrjPccc1fMZVRkc9hTDH1AH4UrsLFIw7sE8c9TTGhXvyelaDRBgOuB1zUZhVd3GR3raJDM9oeoHG3pSCHbkgZzVxl3MQBgCjaB25rVJmbKyx/dyPrtq1HGN2MUu07cgc1PGjLjjNU4tgmTW8YGeMiraR8Zx6FcVnFFdZ0YxXbPHGe31aFZ94YP4/l61Bg0U5hDFssBjqBSrz0p74PtxmmeqODcMYxTlfgd86U4YznrTaGBYdee9OXpnkdqaDnuKkWF2HSi9tQ9x8cXmMGzgL2J5r0DQL24ttNvLexna1vAhmFwm8tuVhgqDzuA5yO1eg+EPCVvfanYQ3KXEkE/wC/dYgw3Hrkj1r2fUvAXhrWtQ0s+I4vCskVnEDcy6TJpskwZeq7o8qo5wcnFdlGM3NI82dSHKzh/Dfwz8e/EzU7/wCzG7uM2yrPfKZjcWltGGJLKqFUBHUA4weoPNe4eKfDvjTxppWoR6vYarpupwKz6dqWnFI2XgBklEhKhQOCMZyAcZrqvht8MdI8EaHG1vo2g2wkjjkl1ewgRJ4WfOJC5BZjyeSOcZ74rqPEj22k+GNVsj4L1G7Wws3SZ9H05JJJUcZLKYs9MdxtYV6lCpHku0crqXl0OC+BXgfWZ/FFz8U9VCw6tKzJpGnuwbzX2lFWQj+IBQM+tfTcGJbOKVlJR0DBR1xivOfAWoWcOhw2N1oOqXFhpsNvZafbtBHKV2qAm5W5bav8fJr0Cz+zSW6fY4/LQcn5cnfXTgYNRUjzJvD4hpux//2Q=="
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
 * @route   GET /api/attendance/attendance
 * @desc    Get attendance data (Dynamic based on logged-in user)
 * @access  Private
 */
router.get('/attendance', authenticateToken, async (req, res) => {
  try {
    // Get user info from JWT token
    const userId = req.user.userId;
    const userEmail = req.user.email || req.user.userId; // Fallback to userId if email not available
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Extract name from email or use default mapping
    let studentName = "Student Name";
    let studentId = "590018435"; // Default for demo
    
    // Dynamic student info based on actual login
    if (userEmail === "sudhanshu@student.com" || userEmail.includes("sudhanshu")) {
      studentName = "Sudhanshu Ranjan";
      studentId = "590018435";
    } else if (userEmail === "demo@student.com") {
      studentName = "Demo Student";
      studentId = "500000001";
    } else {
      // Extract first name from email if possible
      const emailName = userEmail.split('@')[0];
      studentName = emailName.charAt(0).toUpperCase() + emailName.slice(1).replace(/[0-9]/g, '');
    }

    // Get actual subjects from the HTML you provided (7 subjects for Sudhanshu)
    const realSubjects = [
      {
        name: "Discrete Mathematical Structures",
        attended: 14,
        total: 16,
        percentage: 87.5,
        status: "safe"
      },
      {
        name: "Operating Systems", 
        attended: 17,
        total: 19,
        percentage: 89.47,
        status: "safe"
      },
      {
        name: "Fundamentals of Clinical Research",
        attended: 12,
        total: 12,
        percentage: 100.0,
        status: "safe"
      },
      {
        name: "Elements of AIML",
        attended: 19,
        total: 19,
        percentage: 100.0,
        status: "safe"
      },
      {
        name: "Database Management Systems",
        attended: 21,
        total: 23,
        percentage: 91.3,
        status: "safe"
      },
      {
        name: "Design and Analysis of Algorithms", 
        attended: 24,
        total: 24,
        percentage: 100.0,
        status: "safe"
      },
      {
        name: "Biomedical Diagnostics",
        attended: 5,
        total: 6,
        percentage: 83.33,
        status: "safe"
      }
    ];

    // Calculate dynamic summary
    const totalSubjects = realSubjects.length;
    const safeSubjects = realSubjects.filter(s => s.percentage >= 75).length;
    const warningSubjects = realSubjects.filter(s => s.percentage >= 65 && s.percentage < 75).length;
    const criticalSubjects = realSubjects.filter(s => s.percentage < 65).length;
    const overallPercentage = realSubjects.reduce((sum, s) => sum + s.percentage, 0) / totalSubjects;
    const totalClasses = realSubjects.reduce((sum, s) => sum + s.total, 0);
    const attendedClasses = realSubjects.reduce((sum, s) => sum + s.attended, 0);

    const dynamicAttendanceData = {
      success: true,
      data: {
        studentInfo: {
          name: studentName,
          studentId: studentId,
          course: "B.Tech CSE",
          semester: "Semester 3",
          photo: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAIsAa8DASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCwsLL9B3NSLZnjJ7ZNaUduuAMZ+tPWHkDFfhbmfV8rKK221hxUn2TCe9aCw7lHH0qTyOORg+lQ5lcpSaEcAAc0LbhcrjPccc1fMZVRkc9hTDH1AH4UrsLFIw7sE8c9TTGhXvyelaDRBgOuB1zUZhVd3GR3raJDM9oeoHG3pSCHbkgZzVxl3MQBgCjaB25rVJmbKyx/dyPrtq1HGN2MUu07cgc1PGjLjjNU4tgmTW8YGeMiraR8Zx6FcVnFFdZ0YxXbPHGe31aFZ94YP4/l61Bg0U5hDFssBjqBSrz0p74PtxmmeqODcMYxTlfgd86U4YznrTaGBYdee9OXpnkdqaDnuKkWF2HSi9tQ9x8cXmMGzgL2J5r0DQL24ttNvLexna1vAhmFwm8tuVhgqDzuA5yO1eg+EPCVvfanYQ3KXEkE/wC/dYgw3Hrkj1r2fUvAXhrWtQ0s+I4vCskVnEDcy6TJpskwZeq7o8qo5wcnFdlGM3NI82dSHKzh/Dfwz8e/EzU7/wCzG7uM2yrPfKZjcWltGGJLKqFUBHUA4weoPNe4eKfDvjTxppWoR6vYarpupwKz6dqWnFI2XgBklEhKhQOCMZyAcZrqvht8MdI8EaHG1vo2g2wkjjkl1ewgRJ4WfOJC5BZjyeSOcZ74rqPEj22k+GNVsj4L1G7Wws3SZ9H05JJJUcZLKYs9MdxtYV6lCpHku0crqXl0OC+BXgfWZ/FFz8U9VCw6tKzJpGnuwbzX2lFWQj+IBQM+tfTcGJbOKVlJR0DBR1xivOfAWoWcOhw2N1oOqXFhpsNvZafbtBHKV2qAm5W5bav8fJr0Cz+zSW6fY4/LQcn5cnfXTgYNRUjzJvD4hpux//2Q==", // Real student photo
          status: "Active"
        },
        subjects: realSubjects,
        summary: {
          totalSubjects: totalSubjects,
          safeSubjects: safeSubjects,
          warningSubjects: warningSubjects,
          criticalSubjects: criticalSubjects,
          overallPercentage: parseFloat(overallPercentage.toFixed(2))
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          semester: "Current",
          totalClasses: totalClasses,
          attendedClasses: attendedClasses
        }
      }
    };

    console.log(`📊 Dynamic attendance data generated for: ${studentName} (${userEmail})`);
    res.json(dynamicAttendanceData);
  } catch (error) {
    console.error('Dynamic attendance error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch attendance data' 
    });
  }
});

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