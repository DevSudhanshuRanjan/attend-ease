const puppeteer = require('puppeteer');
const { findChrome } = require('../utils/browserFinder');
const logger = require('../config/logger');
require('dotenv').config();

/**
 * Dynamic Attendance Scraping Service
 * Scrapes student profile data and attendance information from UPES portal
 * Works for any logged-in student dynamically
 */
class DynamicAttendanceScrapingService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
    this.studentData = null;
    
    // Portal selectors - placeholders for dynamic portal elements
    this.selectors = {
      // Login page selectors
      login: {
        userIdField: '[placeholder="Enter your user ID"], input[name="userid"], input[id="userid"], input[type="text"]:first-of-type',
        passwordField: '[placeholder="Enter your password"], input[name="password"], input[id="password"], input[type="password"]',
        loginButton: 'button[type="submit"], input[type="submit"], .login-button, #login-btn, .btn-login'
      },
      
      // Student profile selectors (to be populated based on actual portal structure)
      profile: {
        name: '.student-name, .profile-name, .user-name, h2.name, .student-info h3',
        studentId: '.student-id, .profile-id, .student-number, .enrollment-no',
        semester: '.semester, .current-semester, .sem-info',
        course: '.course, .program, .degree',
        profilePicture: '.profile-photo img, .student-photo img, .avatar img, .profile-image img'
      },
      
      // Attendance page selectors
      attendance: {
        attendanceTable: '.attendance-table, table.attendance, .subject-attendance-table',
        tableRows: 'tbody tr, .attendance-row, .subject-row',
        subjectName: '.subject-name, td:nth-child(1), .course-name',
        subjectCode: '.subject-code, .course-code', 
        totalClasses: '.total-classes, .total, td.total',
        attendedClasses: '.attended-classes, .attended, td.attended',
        percentage: '.attendance-percentage, .percentage, td.percentage',
        faculty: '.faculty-name, .instructor, .teacher'
      }
    };
  }

  /**
   * Initialize browser instance with optimized settings
   */
  async initializeBrowser() {
    try {
      logger.info('Initializing browser for dynamic attendance scraping');

      const browserOptions = {
        headless: process.env.NODE_ENV === 'production' ? 'new' : false,
        timeout: parseInt(process.env.BROWSER_TIMEOUT) || 60000,
        defaultViewport: { width: 1366, height: 768 },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--window-size=1366,768'
        ]
      };

      // Try to use system Chrome in production, fallback to bundled Chromium
      if (process.env.NODE_ENV === 'production' && process.env.PUPPETEER_EXECUTABLE_PATH) {
        browserOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      } else {
        const chromePath = await findChrome();
        if (chromePath) {
          browserOptions.executablePath = chromePath;
        }
      }

      this.browser = await puppeteer.launch(browserOptions);
      this.page = await this.browser.newPage();

      // Set user agent and viewport
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );
      
      await this.page.setViewport({ width: 1366, height: 768 });
      this.page.setDefaultTimeout(30000);

      logger.info('Browser initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      throw new Error(`Browser initialization failed: ${error.message}`);
    }
  }

  /**
   * Login to UPES portal with provided credentials
   * @param {string} userId - Student user ID
   * @param {string} password - Student password
   * @returns {Promise<boolean>} - Login success status
   */
  async loginToPortal(userId, password) {
    try {
      if (!this.page) {
        throw new Error('Browser not initialized. Call initializeBrowser() first.');
      }

      logger.info(`Attempting login for user: ${userId}`);
      
      // Navigate to UPES portal login page
      const loginUrl = process.env.UPES_PORTAL_URL || 'https://myupes-beta.upes.ac.in/oneportal/app/auth/login';
      await this.page.goto(loginUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      logger.info('Navigated to login page');

      // Wait for login form to load
      await this.waitForLoginForm();

      // Fill credentials
      await this.fillLoginCredentials(userId, password);

      // Submit login form
      await this.submitLoginForm();

      // Verify login success
      const loginSuccess = await this.verifyLoginSuccess();
      
      if (loginSuccess) {
        this.isLoggedIn = true;
        logger.info(`Login successful for user: ${userId}`);
      } else {
        throw new Error('Login verification failed');
      }

      return loginSuccess;

    } catch (error) {
      logger.error(`Login failed for user ${userId}:`, error);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Wait for login form elements to be available
   */
  async waitForLoginForm() {
    try {
      // Wait for user ID field with multiple selector attempts
      const userIdSelector = await this.waitForAnySelector(this.selectors.login.userIdField.split(', '));
      if (!userIdSelector) {
        throw new Error('User ID field not found');
      }

      // Wait for password field
      const passwordSelector = await this.waitForAnySelector(this.selectors.login.passwordField.split(', '));
      if (!passwordSelector) {
        throw new Error('Password field not found');
      }

      logger.info('Login form elements detected');
      return true;

    } catch (error) {
      // Debug: Log all input fields found on page
      const inputs = await this.page.$$eval('input', elements => 
        elements.map(el => ({
          type: el.type,
          name: el.name,
          id: el.id,
          placeholder: el.placeholder,
          className: el.className
        }))
      );
      logger.debug('Available input fields:', inputs);
      
      throw new Error(`Login form not found: ${error.message}`);
    }
  }

  /**
   * Fill login credentials in the form
   * @param {string} userId - User ID
   * @param {string} password - Password
   */
  async fillLoginCredentials(userId, password) {
    try {
      // Find and fill user ID field
      const userIdSelectors = this.selectors.login.userIdField.split(', ');
      for (const selector of userIdSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            await element.click({ clickCount: 3 });
            await this.page.keyboard.press('Backspace');
            await element.type(userId, { delay: 100 });
            logger.info('User ID filled successfully');
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Find and fill password field
      const passwordSelectors = this.selectors.login.passwordField.split(', ');
      for (const selector of passwordSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            await element.click({ clickCount: 3 });
            await this.page.keyboard.press('Backspace');
            await element.type(password, { delay: 100 });
            logger.info('Password filled successfully');
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Wait for form to register inputs
      await this.page.waitForTimeout(1000);

    } catch (error) {
      throw new Error(`Failed to fill credentials: ${error.message}`);
    }
  }

  /**
   * Submit the login form
   */
  async submitLoginForm() {
    try {
      // Find login button with multiple selectors
      const loginSelectors = this.selectors.login.loginButton.split(', ');
      let submitted = false;

      for (const selector of loginSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            await element.click();
            submitted = true;
            logger.info('Login form submitted');
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!submitted) {
        // Fallback: try Enter key
        await this.page.keyboard.press('Enter');
        logger.info('Login submitted using Enter key');
      }

      // Wait for navigation or response
      await this.page.waitForTimeout(3000);

    } catch (error) {
      throw new Error(`Failed to submit login form: ${error.message}`);
    }
  }

  /**
   * Verify if login was successful
   * @returns {Promise<boolean>} - Login success status
   */
  async verifyLoginSuccess() {
    try {
      // Wait for potential page navigation
      await this.page.waitForTimeout(3000);

      // Check if we're redirected to dashboard or if login elements are gone
      const currentUrl = this.page.url();
      
      // Success indicators
      const successIndicators = [
        () => currentUrl.includes('dashboard'),
        () => currentUrl.includes('home'),
        () => currentUrl.includes('portal') && !currentUrl.includes('login'),
        () => this.page.$('.dashboard, .welcome, .student-info, .profile')
      ];

      for (const check of successIndicators) {
        try {
          if (await check()) {
            return true;
          }
        } catch (e) {
          continue;
        }
      }

      // Check for error messages
      const errorMessages = await this.page.$$eval(
        '.error, .alert-danger, .login-error, [class*="error"]',
        elements => elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
      );

      if (errorMessages.length > 0) {
        throw new Error(`Login failed: ${errorMessages[0]}`);
      }

      // If still on login page, login likely failed
      if (currentUrl.includes('login')) {
        const loginForm = await this.page.$('form, .login-form');
        if (loginForm) {
          throw new Error('Still on login page - credentials may be incorrect');
        }
      }

      return true;

    } catch (error) {
      logger.error('Login verification failed:', error);
      return false;
    }
  }

  /**
   * Scrape student profile data dynamically
   * @returns {Promise<Object>} - Student profile data
   */
  async scrapeStudentProfile() {
    try {
      if (!this.isLoggedIn) {
        throw new Error('Must be logged in to scrape profile data');
      }

      logger.info('Scraping student profile data');

      // Initialize student data object
      const studentData = {
        name: null,
        studentId: null,
        semester: null,
        course: null,
        profilePhoto: null,
        status: 'Active'
      };

      // Scrape profile name
      studentData.name = await this.extractTextFromSelectors(this.selectors.profile.name);
      
      // Scrape student ID
      studentData.studentId = await this.extractTextFromSelectors(this.selectors.profile.studentId);
      
      // Scrape semester
      studentData.semester = await this.extractTextFromSelectors(this.selectors.profile.semester);
      
      // Scrape course/program
      studentData.course = await this.extractTextFromSelectors(this.selectors.profile.course);
      
      // Scrape profile picture
      studentData.profilePhoto = await this.extractImageFromSelectors(this.selectors.profile.profilePicture);

      // Clean and validate data
      studentData.name = this.cleanText(studentData.name) || 'Student Name';
      studentData.studentId = this.cleanText(studentData.studentId) || 'Unknown ID';
      studentData.semester = this.cleanText(studentData.semester) || 'Current Semester';
      studentData.course = this.cleanText(studentData.course) || 'Unknown Course';

      logger.info('Student profile scraped:', studentData.name);
      this.studentData = studentData;
      return studentData;

    } catch (error) {
      logger.error('Failed to scrape student profile:', error);
      throw new Error(`Profile scraping failed: ${error.message}`);
    }
  }

  /**
   * Scrape attendance data dynamically
   * @returns {Promise<Object>} - Attendance data
   */
  async scrapeAttendanceData() {
    try {
      if (!this.isLoggedIn) {
        throw new Error('Must be logged in to scrape attendance data');
      }

      logger.info('Scraping attendance data');

      // Navigate to attendance page if needed
      await this.navigateToAttendancePage();

      // Wait for attendance table to load
      await this.waitForAttendanceTable();

      // Scrape attendance table data
      const attendanceData = await this.extractAttendanceFromTable();

      // Calculate overall statistics
      const overallStats = this.calculateOverallAttendance(attendanceData);

      logger.info(`Scraped attendance for ${attendanceData.length} subjects`);

      return {
        attendance: attendanceData,
        overallAttendance: overallStats,
        metadata: {
          scrapedAt: new Date().toISOString(),
          totalSubjects: attendanceData.length,
          source: 'UPES Portal - Dynamic Scraping'
        }
      };

    } catch (error) {
      logger.error('Failed to scrape attendance data:', error);
      throw new Error(`Attendance scraping failed: ${error.message}`);
    }
  }

  /**
   * Navigate to attendance page
   */
  async navigateToAttendancePage() {
    try {
      // Common attendance page links
      const attendanceLinks = [
        'a[href*="attendance"]',
        '.attendance-link',
        '.nav-attendance', 
        'a:contains("Attendance")',
        'a:contains("attendance")'
      ];

      for (const linkSelector of attendanceLinks) {
        try {
          const link = await this.page.$(linkSelector);
          if (link) {
            await link.click();
            await this.page.waitForTimeout(2000);
            logger.info('Navigated to attendance page');
            return;
          }
        } catch (e) {
          continue;
        }
      }

      logger.info('Attendance page navigation may not be needed - staying on current page');

    } catch (error) {
      logger.warn('Could not navigate to attendance page:', error.message);
      // Continue with current page
    }
  }

  /**
   * Wait for attendance table to be available
   */
  async waitForAttendanceTable() {
    try {
      const tableSelectors = this.selectors.attendance.attendanceTable.split(', ');
      const foundSelector = await this.waitForAnySelector(tableSelectors);
      
      if (!foundSelector) {
        throw new Error('Attendance table not found');
      }

      logger.info('Attendance table detected');
      return true;

    } catch (error) {
      // Debug: Log available tables
      const tables = await this.page.$$eval('table', elements => 
        elements.map((el, idx) => ({
          index: idx,
          className: el.className,
          id: el.id,
          rowCount: el.rows ? el.rows.length : 0
        }))
      );
      logger.debug('Available tables:', tables);
      
      throw new Error(`Attendance table not found: ${error.message}`);
    }
  }

  /**
   * Extract attendance data from table
   * @returns {Promise<Array>} - Array of attendance objects
   */
  async extractAttendanceFromTable() {
    try {
      const attendanceData = [];
      
      // Get table rows
      const rowSelectors = this.selectors.attendance.tableRows.split(', ');
      let rows = [];

      for (const selector of rowSelectors) {
        try {
          rows = await this.page.$$(selector);
          if (rows.length > 0) break;
        } catch (e) {
          continue;
        }
      }

      if (rows.length === 0) {
        throw new Error('No attendance rows found');
      }

      logger.info(`Processing ${rows.length} attendance rows`);

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        try {
          const rowData = await this.extractRowData(rows[i]);
          if (rowData && rowData.subject) {
            attendanceData.push(rowData);
          }
        } catch (error) {
          logger.warn(`Failed to extract data from row ${i}:`, error.message);
          continue;
        }
      }

      return attendanceData;

    } catch (error) {
      throw new Error(`Failed to extract attendance data: ${error.message}`);
    }
  }

  /**
   * Extract data from a single attendance row
   * @param {ElementHandle} row - Row element
   * @returns {Promise<Object>} - Row attendance data
   */
  async extractRowData(row) {
    try {
      // Extract text from cells in the row
      const cells = await row.$$('td');
      
      if (cells.length === 0) {
        return null;
      }

      // Try to extract data based on common patterns
      const rowData = {
        subject: null,
        subjectCode: null,
        total: 0,
        attended: 0,
        percentage: 0,
        status: 'Unknown',
        faculty: null
      };

      // Method 1: Try specific selectors within the row
      rowData.subject = await this.extractTextFromElement(row, this.selectors.attendance.subjectName);
      rowData.subjectCode = await this.extractTextFromElement(row, this.selectors.attendance.subjectCode);
      rowData.faculty = await this.extractTextFromElement(row, this.selectors.attendance.faculty);

      // Method 2: Extract from cells by position (fallback)
      if (!rowData.subject && cells.length >= 1) {
        rowData.subject = await this.page.evaluate(el => el.textContent.trim(), cells[0]);
      }

      // Extract attendance numbers
      for (let i = 0; i < cells.length; i++) {
        const cellText = await this.page.evaluate(el => el.textContent.trim(), cells[i]);
        
        // Look for patterns like "15/20", "15", percentages
        if (cellText.match(/^\d+\/\d+$/)) {
          const [attended, total] = cellText.split('/').map(Number);
          rowData.attended = attended;
          rowData.total = total;
        } else if (cellText.match(/^\d+%$/) || cellText.match(/^\d+\.\d+%$/)) {
          rowData.percentage = parseFloat(cellText.replace('%', ''));
        } else if (cellText.match(/^\d+$/) && parseInt(cellText) > 0) {
          // Could be total or attended classes
          if (!rowData.total) {
            rowData.total = parseInt(cellText);
          } else if (!rowData.attended) {
            rowData.attended = parseInt(cellText);
          }
        }
      }

      // Calculate percentage if not found
      if (rowData.percentage === 0 && rowData.total > 0) {
        rowData.percentage = parseFloat(((rowData.attended / rowData.total) * 100).toFixed(2));
      }

      // Determine status based on percentage
      if (rowData.percentage >= 90) {
        rowData.status = 'Perfect';
      } else if (rowData.percentage >= 85) {
        rowData.status = 'Excellent';
      } else if (rowData.percentage >= 75) {
        rowData.status = 'Good';
      } else if (rowData.percentage >= 65) {
        rowData.status = 'Warning';
      } else {
        rowData.status = 'Critical';
      }

      // Clean data
      rowData.subject = this.cleanText(rowData.subject);
      rowData.subjectCode = this.cleanText(rowData.subjectCode);
      rowData.faculty = this.cleanText(rowData.faculty);

      return rowData;

    } catch (error) {
      logger.error('Failed to extract row data:', error);
      return null;
    }
  }

  /**
   * Calculate overall attendance statistics
   * @param {Array} attendanceData - Array of attendance objects
   * @returns {Object} - Overall statistics
   */
  calculateOverallAttendance(attendanceData) {
    if (!attendanceData || attendanceData.length === 0) {
      return {
        totalClasses: 0,
        attendedClasses: 0,
        overallPercentage: 0,
        status: 'No Data',
        totalSubjects: 0,
        safeSubjects: 0,
        warningSubjects: 0,
        criticalSubjects: 0,
        recommendations: ['No attendance data available']
      };
    }

    const totalClasses = attendanceData.reduce((sum, subject) => sum + subject.total, 0);
    const attendedClasses = attendanceData.reduce((sum, subject) => sum + subject.attended, 0);
    const overallPercentage = totalClasses > 0 ? parseFloat(((attendedClasses / totalClasses) * 100).toFixed(2)) : 0;
    
    const safeSubjects = attendanceData.filter(s => s.percentage >= 75).length;
    const warningSubjects = attendanceData.filter(s => s.percentage >= 65 && s.percentage < 75).length;
    const criticalSubjects = attendanceData.filter(s => s.percentage < 65).length;

    let status = 'Unknown';
    let recommendations = [];

    if (overallPercentage >= 90) {
      status = 'Excellent';
      recommendations.push('Outstanding attendance! Keep up the great work.');
    } else if (overallPercentage >= 85) {
      status = 'Very Good';
      recommendations.push('Great attendance! Continue maintaining regularity.');
    } else if (overallPercentage >= 75) {
      status = 'Good';
      recommendations.push('Good attendance. Try to improve further.');
    } else if (overallPercentage >= 65) {
      status = 'Warning';
      recommendations.push('Attendance is below optimal. Focus on attending more classes.');
    } else {
      status = 'Critical';
      recommendations.push('Critical: Attendance is too low. Immediate improvement needed.');
    }

    if (criticalSubjects > 0) {
      recommendations.push(`${criticalSubjects} subject(s) need immediate attention.`);
    }
    if (warningSubjects > 0) {
      recommendations.push(`${warningSubjects} subject(s) need improvement.`);
    }

    return {
      totalClasses,
      attendedClasses,
      overallPercentage,
      status,
      totalSubjects: attendanceData.length,
      safeSubjects,
      warningSubjects,
      criticalSubjects,
      recommendations
    };
  }

  /**
   * Complete attendance scraping process
   * @param {string} userId - Student user ID
   * @param {string} password - Student password
   * @returns {Promise<Object>} - Complete attendance report
   */
  async scrapeCompleteAttendanceData(userId, password) {
    try {
      logger.info(`Starting complete attendance scraping for user: ${userId}`);

      // Initialize browser
      await this.initializeBrowser();

      // Login to portal
      await this.loginToPortal(userId, password);

      // Scrape student profile
      const studentProfile = await this.scrapeStudentProfile();

      // Scrape attendance data
      const attendanceInfo = await this.scrapeAttendanceData();

      // Combine all data
      const completeReport = {
        success: true,
        student: studentProfile,
        ...attendanceInfo,
        metadata: {
          ...attendanceInfo.metadata,
          requestedBy: userId,
          requestTime: new Date().toISOString(),
          version: '4.0',
          lastUpdated: new Date().toLocaleString()
        }
      };

      logger.info(`Complete attendance report generated for: ${studentProfile.name}`);
      return completeReport;

    } catch (error) {
      logger.error(`Complete scraping failed for user ${userId}:`, error);
      throw error;
    } finally {
      // Cleanup browser resources
      await this.cleanup();
    }
  }

  /**
   * Utility: Wait for any of the provided selectors to be available
   * @param {Array} selectors - Array of selectors to try
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<string|null>} - First matching selector or null
   */
  async waitForAnySelector(selectors, timeout = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      for (const selector of selectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            return selector;
          }
        } catch (e) {
          continue;
        }
      }
      await this.page.waitForTimeout(500);
    }
    
    return null;
  }

  /**
   * Utility: Extract text from selectors
   * @param {string} selectors - Comma-separated selectors
   * @returns {Promise<string|null>} - Extracted text
   */
  async extractTextFromSelectors(selectors) {
    const selectorArray = selectors.split(', ');
    
    for (const selector of selectorArray) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          const text = await this.page.evaluate(el => el.textContent.trim(), element);
          if (text) return text;
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }

  /**
   * Utility: Extract text from element using selectors
   * @param {ElementHandle} parentElement - Parent element
   * @param {string} selectors - Comma-separated selectors
   * @returns {Promise<string|null>} - Extracted text
   */
  async extractTextFromElement(parentElement, selectors) {
    const selectorArray = selectors.split(', ');
    
    for (const selector of selectorArray) {
      try {
        const element = await parentElement.$(selector);
        if (element) {
          const text = await this.page.evaluate(el => el.textContent.trim(), element);
          if (text) return text;
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }

  /**
   * Utility: Extract image source from selectors
   * @param {string} selectors - Comma-separated selectors
   * @returns {Promise<string|null>} - Image source URL
   */
  async extractImageFromSelectors(selectors) {
    const selectorArray = selectors.split(', ');
    
    for (const selector of selectorArray) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          const src = await this.page.evaluate(el => el.src, element);
          if (src && src !== 'data:' && !src.includes('placeholder')) {
            return src;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }

  /**
   * Utility: Clean and normalize text
   * @param {string} text - Text to clean
   * @returns {string|null} - Cleaned text
   */
  cleanText(text) {
    if (!text || typeof text !== 'string') return null;
    
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^\W+|\W+$/g, '')
      .replace(/\n|\r/g, ' ')
      || null;
  }

  /**
   * Cleanup browser resources
   */
  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      
      this.isLoggedIn = false;
      this.studentData = null;
      
      logger.info('Browser cleanup completed');

    } catch (error) {
      logger.error('Cleanup error:', error);
    }
  }
}

module.exports = DynamicAttendanceScrapingService;