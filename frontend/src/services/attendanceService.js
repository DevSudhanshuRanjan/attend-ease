import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance for attendance operations
const attendanceApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes timeout for attendance fetching
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
attendanceApiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
attendanceApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle different error types
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return Promise.reject(new Error('The request is taking longer than expected. Please try again.'));
    }

    if (error.code === 'ERR_NETWORK' || !error.response) {
      return Promise.reject(new Error('Network connection failed. Please check your internet connection.'));
    }

    // Handle API errors with more descriptive messages
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    if (status === 401) {
      if (errorData?.code === 'INVALID_CREDENTIALS') {
        return Promise.reject(new Error('Invalid login credentials. Please check your User ID and password.'));
      } else if (errorData?.code === 'TOKEN_EXPIRED') {
        localStorage.removeItem('authToken');
        return Promise.reject(new Error('Your session has expired. Please login again.'));
      }
      return Promise.reject(new Error('Authentication failed. Please login again.'));
    } else if (status === 429) {
      if (errorData?.code === 'RATE_LIMITED') {
        return Promise.reject(new Error('⚠️ Too many login attempts detected.\n\nPlease wait 15-30 minutes before trying again.\n\nThis is a security measure by UPES portal to prevent unauthorized access.'));
      }
      return Promise.reject(new Error('Rate limit exceeded. Please try again later.'));
    }

    if (status === 503) {
      return Promise.reject(new Error('Service is temporarily unavailable. Please try again in a few minutes.'));
    }

    if (status === 504) {
      return Promise.reject(new Error('The server took too long to respond. Please try again.'));
    }

    if (status === 429) {
      return Promise.reject(new Error('Too many requests. Please wait a few minutes before trying again.'));
    }

    if (status === 404) {
      return Promise.reject(new Error('No attendance data found. Please check if data is available on the portal.'));
    }

    const apiError = errorData?.error || error.message || 'An unexpected error occurred while fetching attendance data';
    return Promise.reject(new Error(apiError));
  }
);

export const attendanceService = {
  /**
   * Fetch attendance data from UPES portal
   * @param {Object} credentials - User credentials
   * @param {string} credentials.password - User password
   * @param {string} token - JWT authentication token
   * @returns {Promise<Object>} Attendance data response
   */
  async fetchAttendance(credentials, token) {
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      console.log('Fetching attendance data...');
      const response = await attendanceApiClient.post('/attendance/fetch', credentials, config);
      
      console.log('Attendance data fetched successfully');
      return response.data;
    } catch (error) {
      console.error('Attendance fetch error:', error);
      throw error;
    }
  },

  /**
   * Get attendance history for a user
   * @param {string} userId - User ID
   * @param {string} token - JWT authentication token
   * @returns {Promise<Object>} Attendance history response
   */
  async getAttendanceHistory(userId, token) {
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await attendanceApiClient.get(`/attendance/history/${userId}`, config);
      return response.data;
    } catch (error) {
      console.error('Attendance history error:', error);
      throw error;
    }
  },

  /**
   * Check service status
   * @returns {Promise<Object>} Service status response
   */
  async checkServiceStatus() {
    try {
      const response = await attendanceApiClient.get('/attendance/status');
      return response.data;
    } catch (error) {
      console.error('Service status check error:', error);
      throw error;
    }
  },

  /**
   * Test connection to UPES portal
   * @param {string} token - JWT authentication token
   * @returns {Promise<Object>} Connection test response
   */
  async testConnection(token) {
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await attendanceApiClient.post('/attendance/test-connection', {}, config);
      return response.data;
    } catch (error) {
      console.error('Connection test error:', error);
      throw error;
    }
  },

  /**
   * Process and format attendance data for display
   * @param {Object} rawData - Raw attendance data from API
   * @returns {Object} Formatted attendance data
   */
  processAttendanceData(rawData) {
    if (!rawData || !rawData.attendance) {
      return null;
    }

    return {
      ...rawData,
      attendance: rawData.attendance.map(subject => ({
        ...subject,
        // Ensure percentage is a number
        percentage: typeof subject.percentage === 'number' 
          ? subject.percentage 
          : parseFloat(subject.percentage) || 0,
        
        // Ensure numeric values are numbers
        totalClasses: parseInt(subject.totalClasses) || 0,
        attendedClasses: parseInt(subject.attendedClasses) || 0,
        
        // Add calculated fields
        absentClasses: (parseInt(subject.totalClasses) || 0) - (parseInt(subject.attendedClasses) || 0),
        
        // Add color coding for UI
        statusColor: this.getStatusColor(subject.status),
        percentageColor: this.getPercentageColor(subject.percentage)
      })),
      
      // Ensure summary values are numbers
      summary: {
        ...rawData.summary,
        totalSubjects: parseInt(rawData.summary?.totalSubjects) || 0,
        safeSubjects: parseInt(rawData.summary?.safeSubjects) || 0,
        warningSubjects: parseInt(rawData.summary?.warningSubjects) || 0,
        criticalSubjects: parseInt(rawData.summary?.criticalSubjects) || 0,
        overallPercentage: parseFloat(rawData.summary?.overallPercentage) || 0
      }
    };
  },

  /**
   * Get status color for UI
   * @param {string} status - Subject status
   * @returns {string} CSS color class
   */
  getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case 'safe':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  },

  /**
   * Get percentage color for UI
   * @param {number} percentage - Attendance percentage
   * @returns {string} CSS color class
   */
  getPercentageColor(percentage) {
    const pct = parseFloat(percentage) || 0;
    if (pct >= 75) return 'text-green-600';
    if (pct >= 65) return 'text-yellow-600';
    return 'text-red-600';
  },

  /**
   * Calculate classes needed to reach target percentage
   * @param {Object} subject - Subject data
   * @param {number} targetPercentage - Target percentage (default: 75)
   * @returns {number} Number of classes to attend
   */
  calculateClassesToAttend(subject, targetPercentage = 75) {
    const currentAttended = parseInt(subject.attendedClasses) || 0;
    const currentTotal = parseInt(subject.totalClasses) || 0;
    const currentPercentage = parseFloat(subject.percentage) || 0;

    if (currentPercentage >= targetPercentage) {
      return 0;
    }

    // Formula: (currentAttended + x) / (currentTotal + x) = targetPercentage/100
    // Solving for x: x = (targetPercentage * currentTotal - currentAttended * 100) / (100 - targetPercentage)
    const classesNeeded = Math.ceil(
      (targetPercentage * currentTotal - currentAttended * 100) / (100 - targetPercentage)
    );

    return Math.max(0, classesNeeded);
  },

  /**
   * Get attendance insights and recommendations
   * @param {Object} attendanceData - Processed attendance data
   * @returns {Object} Insights and recommendations
   */
  getAttendanceInsights(attendanceData) {
    if (!attendanceData?.attendance) {
      return null;
    }

    const insights = {
      criticalSubjects: [],
      warningSubjects: [],
      safeSubjects: [],
      recommendations: []
    };

    attendanceData.attendance.forEach(subject => {
      const classesNeeded = this.calculateClassesToAttend(subject);
      const subjectWithInsights = {
        ...subject,
        classesNeeded
      };

      if (subject.status.toLowerCase() === 'critical') {
        insights.criticalSubjects.push(subjectWithInsights);
      } else if (subject.status.toLowerCase() === 'warning') {
        insights.warningSubjects.push(subjectWithInsights);
      } else {
        insights.safeSubjects.push(subjectWithInsights);
      }
    });

    // Generate recommendations
    if (insights.criticalSubjects.length > 0) {
      insights.recommendations.push({
        type: 'critical',
        message: `Immediate action required for ${insights.criticalSubjects.length} subject(s). Contact your faculty members immediately.`,
        subjects: insights.criticalSubjects.map(s => s.subject)
      });
    }

    if (insights.warningSubjects.length > 0) {
      insights.recommendations.push({
        type: 'warning',
        message: `${insights.warningSubjects.length} subject(s) need attention. Attend all upcoming classes.`,
        subjects: insights.warningSubjects.map(s => s.subject)
      });
    }

    if (insights.safeSubjects.length === attendanceData.attendance.length) {
      insights.recommendations.push({
        type: 'success',
        message: 'Excellent! All subjects have safe attendance. Keep up the great work.',
        subjects: []
      });
    }

    return insights;
  }
};

export default attendanceService;