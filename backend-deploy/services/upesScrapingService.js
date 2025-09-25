const puppeteer = require('puppeteer-core');
const { findChrome } = require('../utils/browserFinder');
require('dotenv').config();

class UPESScrapingService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize browser and page
   */
  async initBrowser() {
    try {
      // Find Chrome browser
      const chromePath = await findChrome();
      
      if (!chromePath) {
        throw new Error('Chrome browser not found. Please install Google Chrome or Chromium.');
      }

      this.browser = await puppeteer.launch({
        headless: 'new', // Use new headless mode
        executablePath: chromePath,
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
          '--window-size=1280,720'
        ],
        timeout: parseInt(process.env.BROWSER_TIMEOUT) || 60000,
        defaultViewport: { width: 1280, height: 720 }
      });

      this.page = await this.browser.newPage();
      
      // Set viewport and user agent
      await this.page.setViewport({ width: 1280, height: 720 });
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      // Set timeouts
      this.page.setDefaultTimeout(parseInt(process.env.UPES_NAVIGATION_TIMEOUT) || 15000);
      
      console.log('Browser initialized successfully');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw new Error('Browser initialization failed');
    }
  }

  /**
   * Login to UPES Beta Portal
   * @param {string} userId - Student ID
   * @param {string} password - Password
   * @returns {Promise<boolean>} - Login success status
   */
  async login(userId, password) {
    try {
      if (!this.page) {
        throw new Error('Browser not initialized');
      }

      console.log('Navigating to UPES Beta Portal...');
      
      // Navigate to login page
      await this.page.goto(process.env.UPES_PORTAL_URL || 'https://myupes-beta.upes.ac.in/oneportal/app/auth/login', {
        waitUntil: 'networkidle2',
        timeout: parseInt(process.env.UPES_LOGIN_TIMEOUT) || 30000
      });

      // Wait for login form elements with multiple strategies
      console.log('Waiting for login form elements...');
      
      try {
        await this.page.waitForSelector('input[name="userid"], input[id="userid"], input[type="text"], input[placeholder*="ID"], input[placeholder*="Email"]', { timeout: 15000 });
        console.log('User ID field found');
      } catch (e) {
        console.log('Standard user ID selectors failed, trying alternatives...');
        const allInputs = await this.page.$$eval('input', inputs => 
          inputs.map(input => ({
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            className: input.className
          }))
        );
        console.log('Available input fields:', allInputs);
        throw new Error('User ID field not found');
      }

      try {
        await this.page.waitForSelector('input[name="password"], input[id="password"], input[type="password"]', { timeout: 10000 });
        console.log('Password field found');
      } catch (e) {
        console.log('Password field not found with standard selectors');
        throw new Error('Password field not found');
      }

      // Get login form elements with improved selectors
      let userIdSelector = await this.page.$('input[name="userid"]') || 
                          await this.page.$('input[id="userid"]') || 
                          await this.page.$('input[type="text"]') ||
                          await this.page.$('input[placeholder*="ID"]') ||
                          await this.page.$('input[placeholder*="Email"]');
      
      let passwordSelector = await this.page.$('input[name="password"]') || 
                            await this.page.$('input[id="password"]') || 
                            await this.page.$('input[type="password"]');

      if (!userIdSelector || !passwordSelector) {
        throw new Error('Login form elements not found after detection');
      }

      console.log('Filling login credentials...');
      
      // Clear and fill user ID
      await userIdSelector.click({ clickCount: 3 });
      await this.page.keyboard.press('Backspace');
      await userIdSelector.type(userId, { delay: 100 });
      
      // Clear and fill password
      await passwordSelector.click({ clickCount: 3 });
      await this.page.keyboard.press('Backspace');
      await passwordSelector.type(password, { delay: 100 });

      // Wait a moment for form to register the input
      await this.page.waitForTimeout(1000);

      // Find submit button with multiple strategies
      console.log('Looking for submit button...');
      let submitButton = await this.page.$('input[type="submit"]') || 
                        await this.page.$('button[type="submit"]') ||
                        await this.page.$('button[class*="submit"]') ||
                        await this.page.$('button[class*="login"]') ||
                        await this.page.$('input[value*="Login"]') ||
                        await this.page.$('input[value*="login"]');

      // If no specific submit button found, look for any button
      if (!submitButton) {
        const buttons = await this.page.$$('button');
        console.log(`Found ${buttons.length} buttons on page`);
        
        for (const button of buttons) {
          const text = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
          console.log('Button text:', text);
          if (text.includes('login') || text.includes('submit') || text.includes('sign in')) {
            submitButton = button;
            break;
          }
        }
      }

      if (!submitButton) {
        // Try form submission instead
        console.log('No submit button found, trying form submission...');
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(3000);
      } else {
        console.log('Submitting login credentials...');
        
        // Click login and wait for navigation
        try {
          await Promise.all([
            this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 25000 }),
            submitButton.click()
          ]);
        } catch (navError) {
          console.log('Navigation timeout, but continuing to check login status...');
          await this.page.waitForTimeout(3000);
        }
      }

      // Check if login was successful with improved detection
      await this.page.waitForTimeout(3000);

      const currentUrl = this.page.url();
      console.log('Current URL after login:', currentUrl);

      // Check for error messages with expanded selectors including rate limiting
      const errorElements = await this.page.$$eval(
        'div.error, .alert-danger, .error-message, [class*="error"], .alert, .warning, [class*="alert"]',
        elements => elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
      );

      if (errorElements.length > 0) {
        const errorMessage = errorElements.join(', ');
        console.log('Login error detected:', errorMessage);
        
        // Check for rate limiting specifically
        if (errorMessage.toLowerCase().includes('too many') || 
            errorMessage.toLowerCase().includes('login attempts') ||
            errorMessage.toLowerCase().includes('try again later')) {
          throw new Error(`RATE_LIMITED: ${errorMessage}`);
        }
        
        throw new Error(`Login failed: ${errorMessage}`);
      }

      // Enhanced login success detection
      const isStillOnLoginPage = currentUrl.includes('login') || 
                                currentUrl.includes('auth') ||
                                currentUrl === (process.env.UPES_PORTAL_URL || 'https://myupes-beta.upes.ac.in/oneportal/app/auth/login');

      // Check for dashboard indicators
      const dashboardIndicators = await this.page.evaluate(() => {
        const indicators = [];
        
        // Look for common dashboard elements
        if (document.querySelector('[class*="dashboard"]')) indicators.push('dashboard-class');
        if (document.querySelector('[class*="attendance"]')) indicators.push('attendance-class');
        if (document.querySelector('[class*="student"]')) indicators.push('student-class');
        if (document.querySelector('nav, .navbar')) indicators.push('navigation');
        if (document.querySelector('.logout, [class*="logout"]')) indicators.push('logout-button');
        
        // Check page title
        if (document.title && !document.title.toLowerCase().includes('login')) {
          indicators.push('non-login-title');
        }
        
        return indicators;
      });

      console.log('Dashboard indicators found:', dashboardIndicators);

      if (isStillOnLoginPage && dashboardIndicators.length === 0) {
        console.log('Still appears to be on login page with no dashboard indicators');
        throw new Error('Login failed: Still on login page');
      }

      console.log('Login successful - proceeding to attendance page');
      return true;

    } catch (error) {
      console.error('Login failed:', error.message);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Navigate to attendance page and scrape attendance data
   * @returns {Promise<Array>} - Array of attendance objects
   */
  async scrapeAttendanceData() {
    try {
      if (!this.page) {
        throw new Error('Browser not initialized');
      }

      console.log('Extracting attendance data from UPES dashboard...');

      // Wait for the page to fully load and Angular to render
      await this.page.waitForTimeout(10000);

      // Take a screenshot for debugging
      await this.page.screenshot({ 
        path: 'upes-dashboard.png', 
        fullPage: true 
      });
      console.log('Dashboard screenshot saved as upes-dashboard.png');

      // Extract attendance data from the UPES dashboard using the specific Angular structure
      const attendanceData = await this.page.evaluate(() => {
        const attendanceInfo = [];

        // Look for the specific UPES attendance wrapper
        const attendanceWrapper = document.querySelector('.attendance-warpper');
        
        if (attendanceWrapper) {
          console.log('Found attendance wrapper');
          
          // Get all attendance rows
          const attendanceRows = attendanceWrapper.querySelectorAll('.row.mb-2');
          console.log('Found attendance rows:', attendanceRows.length);
          
          for (const row of attendanceRows) {
            try {
              // Extract subject name from .attndnce-mod span
              const subjectElement = row.querySelector('.attndnce-mod');
              const subjectName = subjectElement ? subjectElement.textContent.trim() : null;
              
              // Extract count (attended/total) from .count-text span
              const countElement = row.querySelector('.count-text');
              const countText = countElement ? countElement.textContent.trim() : null;
              
              // Extract percentage from .percentage-text span
              const percentageElement = row.querySelector('.percentage-text');
              const percentageText = percentageElement ? percentageElement.textContent.trim() : null;
              
              if (subjectName && countText && percentageText) {
                // Parse the count (e.g., "13/15")
                const countMatch = countText.match(/(\d+)\/(\d+)/);
                let attended = null;
                let total = null;
                
                if (countMatch) {
                  attended = parseInt(countMatch[1]);
                  total = parseInt(countMatch[2]);
                }
                
                // Parse percentage (e.g., "86.67%")
                const percentageMatch = percentageText.match(/(\d+(?:\.\d+)?)/);
                const percentage = percentageMatch ? parseFloat(percentageMatch[1]) : 0;
                
                // Determine status based on percentage
                let status = 'Unknown';
                if (percentage >= 75) {
                  status = 'Good';
                } else if (percentage >= 65) {
                  status = 'Warning';
                } else {
                  status = 'Critical';
                }
                
                attendanceInfo.push({
                  subject: subjectName,
                  attended: attended,
                  total: total,
                  percentage: parseFloat(percentage.toFixed(2)),
                  status: status
                });
                
                console.log('Extracted:', {
                  subject: subjectName,
                  count: countText,
                  percentage: percentageText,
                  parsed: { attended, total, percentage }
                });
              }
            } catch (rowError) {
              console.error('Error processing row:', rowError);
              continue;
            }
          }
        } else {
          console.log('Attendance wrapper not found, trying alternative selectors...');
          
          // Alternative: Look for any elements with the specific class names
          const subjectElements = document.querySelectorAll('.attndnce-mod');
          const countElements = document.querySelectorAll('.count-text');
          const percentageElements = document.querySelectorAll('.percentage-text');
          
          console.log('Found elements:', {
            subjects: subjectElements.length,
            counts: countElements.length,
            percentages: percentageElements.length
          });
          
          // Match them up if they have the same count
          if (subjectElements.length === countElements.length && 
              countElements.length === percentageElements.length) {
            
            for (let i = 0; i < subjectElements.length; i++) {
              const subjectName = subjectElements[i].textContent.trim();
              const countText = countElements[i].textContent.trim();
              const percentageText = percentageElements[i].textContent.trim();
              
              // Parse the count
              const countMatch = countText.match(/(\d+)\/(\d+)/);
              let attended = null;
              let total = null;
              
              if (countMatch) {
                attended = parseInt(countMatch[1]);
                total = parseInt(countMatch[2]);
              }
              
              // Parse percentage
              const percentageMatch = percentageText.match(/(\d+(?:\.\d+)?)/);
              const percentage = percentageMatch ? parseFloat(percentageMatch[1]) : 0;
              
              // Determine status
              let status = 'Unknown';
              if (percentage >= 75) {
                status = 'Good';
              } else if (percentage >= 65) {
                status = 'Warning';
              } else {
                status = 'Critical';
              }
              
              attendanceInfo.push({
                subject: subjectName,
                attended: attended,
                total: total,
                percentage: parseFloat(percentage.toFixed(2)),
                status: status
              });
            }
          }
        }

        console.log('Final attendance data:', attendanceInfo);
        return attendanceInfo;
      });

      console.log(`Successfully extracted ${attendanceData.length} attendance records`);

      // Log each extracted record
      attendanceData.forEach((record, index) => {
        console.log(`Subject ${index + 1}:`, record);
      });

      return attendanceData;

    } catch (error) {
      console.error('Attendance scraping failed:', error.message);
      console.error('Stack trace:', error.stack);
      
      // Don't return sample data, let the error bubble up so we can debug
      throw new Error(`Failed to scrape attendance data: ${error.message}`);
    }
  }

  /**
   * Get student profile information
   * @returns {Promise<Object>} - Student profile object
   */
  async getStudentProfile() {
    try {
      const profile = await this.page.evaluate(() => {
        // Simple and robust profile extraction
        let name = 'Student Name'; // Better default
        let studentId = '590018413'; // Default from logs
        let course = 'B.Tech CSE'; // Default
        let semester = 'Semester 3'; // Default
        let profilePhoto = null;
        let status = 'Active';

        console.log('Starting simplified profile extraction...');
        console.log('Page URL:', window.location.href);
        
        // Enhanced profile photo extraction with base64 support
        console.log('Looking for profile photos...');
        
        // First, try the specific selector from the provided HTML
        const profileAvatarImg = document.querySelector('.profile-avatar-wrapper img.user-avatar');
        if (profileAvatarImg && profileAvatarImg.src) {
          profilePhoto = profileAvatarImg.src;
          console.log('✅ Found profile avatar with specific selector:', profilePhoto.substring(0, 100) + '...');
        }
        
        // If not found, look for any base64 images (data:image/...)
        if (!profilePhoto) {
          const base64Images = document.querySelectorAll('img[src^="data:image"]');
          console.log('Found', base64Images.length, 'base64 images');
          
          if (base64Images.length > 0) {
            // Take the first base64 image, assuming it's the profile photo
            profilePhoto = base64Images[0].src;
            console.log('✅ Found base64 profile photo:', profilePhoto.substring(0, 100) + '...');
          }
        }
        
        // Fallback to other selectors if needed
        if (!profilePhoto) {
          const photoSelectors = [
            'img.user-avatar',
            'img[class*="avatar"]',
            'img[class*="profile"]',
            'img[alt*="profile" i]',
            'img[alt*="photo" i]',
            '.user-avatar img',
            '.profile-photo img',
            'img[class*="user"]'
          ];

          for (const selector of photoSelectors) {
            try {
              const photoElement = document.querySelector(selector);
              if (photoElement && photoElement.src) {
                // Accept both HTTP URLs and base64 data URLs, but not SVG
                if (photoElement.src.startsWith('data:image/') && !photoElement.src.includes('svg')) {
                  profilePhoto = photoElement.src;
                  console.log('✅ Found base64 photo with selector', selector);
                  break;
                } else if (photoElement.src.startsWith('http')) {
                  profilePhoto = photoElement.src;
                  console.log('✅ Found HTTP photo with selector', selector);
                  break;
                }
              }
            } catch (e) {
              continue;
            }
          }
        }
        
        // Debug all images if still no photo found
        if (!profilePhoto) {
          console.log('⚠️  No profile photo found. Debugging all images:');
          const allImages = document.querySelectorAll('img');
          allImages.forEach((img, index) => {
            if (img.src) {
              const srcPreview = img.src.length > 100 ? 
                img.src.substring(0, 100) + '...' : img.src;
              console.log(`Image ${index}: src="${srcPreview}", alt="${img.alt || 'no alt'}", class="${img.className || 'no class'}"`);
            }
          });
        }

        // Enhanced name extraction to avoid "PMModules selected by" and "Class Room" issues
        try {
          const bodyText = document.body.textContent || '';
          console.log('Body text sample for name extraction:', bodyText.substring(0, 1000));
          
          // Debug: Look for "Class Room" occurrences
          const classRoomOccurrences = bodyText.match(/Class Room/gi) || [];
          console.log('Found "Class Room" occurrences:', classRoomOccurrences.length);
          
          // First, try to find name in welcome/greeting messages, avoiding unwanted text
          const namePatterns = [
            /Welcome[,\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})(?!\s*selected)/i,
            /Hello[,\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})(?!\s*selected)/i,
            /Hi[,\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})(?!\s*selected)/i,
            /Student Name:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i,
            /Name:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i
          ];
          
          for (const pattern of namePatterns) {
            const match = bodyText.match(pattern);
            if (match && match[1].trim().length >= 5) {
              const candidateName = match[1].trim();
              
              // Strict filtering to avoid unwanted text
              const unwantedPhrases = [
                'selected', 'PMModules', 'Student ID', 'Dashboard', 
                'Attendance', 'Module', 'Course', 'Semester', 'Year',
                'Login', 'Logout', 'Home', 'Profile', 'Settings',
                'Class Room', 'Classroom', 'Room', 'Class'
              ];
              
              const hasUnwantedText = unwantedPhrases.some(phrase => 
                candidateName.toLowerCase().includes(phrase.toLowerCase())
              );
              
              if (!hasUnwantedText && candidateName.split(' ').length >= 2) {
                name = candidateName;
                console.log('✅ Found valid name from pattern:', name);
                break;
              }
            }
          }
          
          // If still no valid name, try element-based extraction with strict filtering
          if (name === 'Student Name') {
            // First try the specific UPES selector for student name
            try {
              const userNameElement = document.querySelector('h3.user-name a.student-profile-link');
              if (userNameElement) {
                const extractedName = userNameElement.textContent.trim();
                console.log('Found name from specific UPES selector:', extractedName);
                
                if (extractedName && extractedName.length >= 4 && extractedName.length <= 50) {
                  // Validate it's not UI text - more flexible for names like "Aman NA"
                  const unwantedUIText = ['class room', 'classroom', 'pmmodules', 'selected', 'dashboard'];
                  const isUIText = unwantedUIText.some(term => 
                    extractedName.toLowerCase().includes(term)
                  );
                  
                  // Additional check: should look like a name (letters and spaces only)
                  const looksLikeName = /^[A-Za-z\s]+$/.test(extractedName) && 
                                       extractedName.split(' ').length >= 2;
                  
                  if (!isUIText && looksLikeName) {
                    name = extractedName;
                    console.log('✅ Successfully extracted name from UPES selector:', name);
                  }
                }
              }
            } catch (e) {
              console.log('Error with UPES selector:', e);
            }
            
            // Fallback to other selectors if needed
            if (name === 'Student Name') {
              const nameSelectors = [
                '.user-name a', '.user-name', 'h3.user-name', 
                'h1', 'h2', 'h3', '.student-name', 
                '.profile-name', '[class*="name"]', '.welcome-message'
              ];
            
              for (const selector of nameSelectors) {
                try {
                  const elements = document.querySelectorAll(selector);
                  for (const element of elements) {
                    const text = element.textContent.trim();
                    
                    // Valid name criteria: proper name format (more flexible for abbreviated names)
                    const isValidName = /^[A-Za-z\s]+$/.test(text) && 
                                      text.split(' ').length >= 2 &&
                                      text.length >= 4 && text.length <= 50;
                    
                    if (isValidName) {
                      // Additional unwanted text filtering
                      const unwantedTerms = [
                        'selected', 'pmmodules', 'student', 'dashboard', 
                        'attendance', 'module', 'course', 'semester', 'year',
                        'login', 'logout', 'home', 'profile', 'settings', 
                        'welcome', 'hello', 'hi', 'class room', 'classroom', 'room', 'class'
                      ];
                      
                      const hasUnwantedTerms = unwantedTerms.some(term => 
                        text.toLowerCase().includes(term)
                      );
                      
                      if (!hasUnwantedTerms) {
                        name = text;
                        console.log('✅ Found valid name from element:', name, 'using selector:', selector);
                        break;
                      }
                    }
                  }
                  if (name !== 'Student Name') break;
                } catch (e) {
                  continue;
                }
              }
            }
          }
          
          // Final check: if we still have default name, try to extract from any text
          // that looks like a proper name but be very strict
          if (name === 'Student Name') {
            const allText = bodyText.replace(/PMModules selected by/gi, '').replace(/Class Room/gi, ''); // Remove specific phrases
            const nameMatches = allText.match(/\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\b/g);
            
            if (nameMatches) {
              for (const match of nameMatches) {
                const cleanMatch = match.trim();
                if (cleanMatch.split(' ').length >= 2 && cleanMatch.split(' ').length <= 4) {
                  // Additional validation - avoid common non-name phrases
                  const commonNonNames = [
                    'Student Portal', 'Web Portal', 'Online Portal', 'Login Page',
                    'Home Page', 'Main Dashboard', 'User Interface', 'Beta Version',
                    'Class Room', 'Classroom'
                  ];
                  
                  if (!commonNonNames.some(phrase => 
                    cleanMatch.toLowerCase().includes(phrase.toLowerCase())
                  )) {
                    name = cleanMatch;
                    console.log('✅ Found name from text analysis:', name);
                    break;
                  }
                }
              }
            }
          }

          // Look for student ID
          const idMatch = bodyText.match(/(?:Student\s*ID|ID):\s*(\d{8,12})/i) || 
                          bodyText.match(/\b(590018\d{3})\b/) || // UPES pattern
                          bodyText.match(/\b(\d{9,10})\b/);
          if (idMatch) {
            studentId = idMatch[1];
            console.log('Found student ID:', studentId);
          }

          // Look for course
          const courseMatch = bodyText.match(/(B\.Tech\s*(?:CSE|Computer Science|ECE|ME|CE|EE|IT)?|BCA|MCA|M\.Tech)/i);
          if (courseMatch) {
            course = courseMatch[1];
            console.log('Found course:', course);
          }

          // Look for semester
          const semesterMatch = bodyText.match(/Semester\s*(\d+)/i);
          if (semesterMatch) {
            semester = `Semester ${semesterMatch[1]}`;
            console.log('Found semester:', semester);
          }

        } catch (error) {
          console.log('Error in text extraction:', error);
        }

        const result = { 
          name, 
          studentId, 
          course, 
          semester, 
          status,
          profilePhoto 
        };
        
        console.log('Final profile result:', result);
        return result;
      });

      console.log('Extracted student profile:', profile);
      return profile;
    } catch (error) {
      console.error('Failed to get student profile:', error);
      // Return default profile
      return {
        name: 'Student Name',
        studentId: '590018413',
        course: 'B.Tech CSE',
        semester: 'Semester 3',
        status: 'Active',
        profilePhoto: null
      };
    }
  }

  /**
   * Close browser and cleanup
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
      console.log('Browser cleanup completed');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  /**
   * Full attendance fetching workflow
   * @param {string} userId - Student ID
   * @param {string} password - Password
   * @returns {Promise<Object>} - Complete attendance report
   */
  async fetchAttendanceReport(userId, password) {
    try {
      await this.initBrowser();
      await this.login(userId, password);
      
      const attendanceData = await this.scrapeAttendanceData();
      const profile = await this.getStudentProfile();
      
      const report = {
        success: true,
        timestamp: new Date().toISOString(),
        student: profile,
        attendance: attendanceData,
        summary: {
          totalSubjects: attendanceData.length,
          safeSubjects: attendanceData.filter(a => a.status === 'Good' || a.percentage >= 75).length,
          warningSubjects: attendanceData.filter(a => a.status === 'Warning' || (a.percentage >= 65 && a.percentage < 75)).length,
          criticalSubjects: attendanceData.filter(a => a.status === 'Critical' || a.percentage < 65).length,
          overallPercentage: attendanceData.length > 0 ? 
            parseFloat((attendanceData.reduce((sum, a) => sum + a.percentage, 0) / attendanceData.length).toFixed(2)) : 0
        }
      };

      return report;

    } catch (error) {
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

module.exports = UPESScrapingService;