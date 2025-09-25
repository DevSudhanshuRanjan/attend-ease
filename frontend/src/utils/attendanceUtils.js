/**
 * Utility functions for attendance calculations and formatting
 */

/**
 * Calculate the number of classes needed to reach a target percentage
 * @param {number} currentAttended - Current attended classes
 * @param {number} currentTotal - Current total classes
 * @param {number} targetPercentage - Target percentage (default: 75)
 * @returns {number} Number of classes needed
 */
export const calculateClassesNeeded = (currentAttended, currentTotal, targetPercentage = 75) => {
  if (currentTotal === 0) return 0;
  
  const currentPercentage = (currentAttended / currentTotal) * 100;
  
  if (currentPercentage >= targetPercentage) {
    return 0;
  }
  
  // Formula: (currentAttended + x) / (currentTotal + x) = targetPercentage/100
  // Solving for x: x = (targetPercentage * currentTotal - currentAttended * 100) / (100 - targetPercentage)
  const classesNeeded = Math.ceil(
    (targetPercentage * currentTotal - currentAttended * 100) / (100 - targetPercentage)
  );
  
  return Math.max(0, classesNeeded);
};

/**
 * Calculate how many classes can be missed while maintaining target percentage
 * @param {number} currentAttended - Current attended classes
 * @param {number} currentTotal - Current total classes
 * @param {number} targetPercentage - Target percentage (default: 75)
 * @returns {number} Number of classes that can be missed
 */
export const calculateClassesCanMiss = (currentAttended, currentTotal, targetPercentage = 75) => {
  if (currentTotal === 0) return 0;
  
  const currentPercentage = (currentAttended / currentTotal) * 100;
  
  if (currentPercentage < targetPercentage) {
    return 0;
  }
  
  // Calculate maximum classes that can be missed
  // (currentAttended) / (currentTotal + x) = targetPercentage/100
  // Solving for x: x = (currentAttended * 100 / targetPercentage) - currentTotal
  const maxTotalClasses = currentAttended * 100 / targetPercentage;
  const classesCanMiss = Math.floor(maxTotalClasses - currentTotal);
  
  return Math.max(0, classesCanMiss);
};

/**
 * Get attendance status based on percentage
 * @param {number} percentage - Attendance percentage
 * @returns {Object} Status object with status and color
 */
export const getAttendanceStatus = (percentage) => {
  if (percentage >= 75) {
    return {
      status: 'Safe',
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-200'
    };
  } else if (percentage >= 65) {
    return {
      status: 'Warning',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200'
    };
  } else {
    return {
      status: 'Critical',
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200'
    };
  }
};

/**
 * Format percentage for display
 * @param {number} percentage - Percentage value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (percentage, decimals = 1) => {
  if (isNaN(percentage)) return '0.0%';
  return `${parseFloat(percentage).toFixed(decimals)}%`;
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', formatOptions);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Validate attendance data structure
 * @param {Object} data - Attendance data to validate
 * @returns {Object} Validation result
 */
export const validateAttendanceData = (data) => {
  const errors = [];
  
  if (!data) {
    errors.push('Attendance data is required');
    return { isValid: false, errors };
  }
  
  if (!data.attendance || !Array.isArray(data.attendance)) {
    errors.push('Attendance array is required');
  }
  
  if (!data.summary || typeof data.summary !== 'object') {
    errors.push('Summary object is required');
  }
  
  if (!data.timestamp) {
    errors.push('Timestamp is required');
  }
  
  // Validate each subject
  if (data.attendance && Array.isArray(data.attendance)) {
    data.attendance.forEach((subject, index) => {
      if (!subject.subject) {
        errors.push(`Subject name is required for item ${index + 1}`);
      }
      
      if (typeof subject.percentage !== 'number' || isNaN(subject.percentage)) {
        errors.push(`Valid percentage is required for ${subject.subject || `item ${index + 1}`}`);
      }
      
      if (typeof subject.totalClasses !== 'number' || subject.totalClasses < 0) {
        errors.push(`Valid total classes count is required for ${subject.subject || `item ${index + 1}`}`);
      }
      
      if (typeof subject.attendedClasses !== 'number' || subject.attendedClasses < 0) {
        errors.push(`Valid attended classes count is required for ${subject.subject || `item ${index + 1}`}`);
      }
      
      if (subject.attendedClasses > subject.totalClasses) {
        errors.push(`Attended classes cannot exceed total classes for ${subject.subject || `item ${index + 1}`}`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sort attendance data by different criteria
 * @param {Array} attendance - Attendance array
 * @param {string} sortBy - Sort criteria ('subject', 'percentage', 'status')
 * @param {string} order - Sort order ('asc', 'desc')
 * @returns {Array} Sorted attendance array
 */
export const sortAttendanceData = (attendance, sortBy = 'subject', order = 'asc') => {
  if (!Array.isArray(attendance)) return [];
  
  const sorted = [...attendance].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'subject':
        comparison = a.subject.localeCompare(b.subject);
        break;
      case 'percentage':
        comparison = a.percentage - b.percentage;
        break;
      case 'status':
        const statusOrder = { 'Critical': 0, 'Warning': 1, 'Safe': 2 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      case 'totalClasses':
        comparison = a.totalClasses - b.totalClasses;
        break;
      case 'attendedClasses':
        comparison = a.attendedClasses - b.attendedClasses;
        break;
      default:
        return 0;
    }
    
    return order === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
};

/**
 * Filter attendance data by status
 * @param {Array} attendance - Attendance array
 * @param {string} filter - Filter criteria ('all', 'safe', 'warning', 'critical')
 * @returns {Array} Filtered attendance array
 */
export const filterAttendanceData = (attendance, filter = 'all') => {
  if (!Array.isArray(attendance)) return [];
  
  if (filter === 'all') return attendance;
  
  return attendance.filter(subject => 
    subject.status.toLowerCase() === filter.toLowerCase()
  );
};

/**
 * Generate attendance insights and recommendations
 * @param {Object} attendanceData - Complete attendance data
 * @returns {Object} Insights object
 */
export const generateAttendanceInsights = (attendanceData) => {
  if (!attendanceData || !attendanceData.attendance) {
    return null;
  }
  
  const { attendance, summary } = attendanceData;
  const insights = {
    overall: {
      status: getAttendanceStatus(summary.overallPercentage),
      totalSubjects: summary.totalSubjects,
      overallPercentage: summary.overallPercentage
    },
    breakdown: {
      safe: attendance.filter(s => s.status === 'Safe'),
      warning: attendance.filter(s => s.status === 'Warning'),
      critical: attendance.filter(s => s.status === 'Critical')
    },
    recommendations: [],
    actionItems: []
  };
  
  // Generate recommendations
  if (insights.breakdown.critical.length > 0) {
    insights.recommendations.push({
      type: 'urgent',
      title: 'Immediate Action Required',
      message: `${insights.breakdown.critical.length} subject(s) have critical attendance. Contact faculty immediately.`,
      subjects: insights.breakdown.critical.map(s => s.subject)
    });
    
    insights.breakdown.critical.forEach(subject => {
      const classesNeeded = calculateClassesNeeded(subject.attendedClasses, subject.totalClasses);
      insights.actionItems.push({
        subject: subject.subject,
        action: `Attend next ${classesNeeded} classes to reach 75%`,
        priority: 'high',
        classesNeeded
      });
    });
  }
  
  if (insights.breakdown.warning.length > 0) {
    insights.recommendations.push({
      type: 'caution',
      title: 'Attention Needed',
      message: `${insights.breakdown.warning.length} subject(s) need careful attention to maintain eligibility.`,
      subjects: insights.breakdown.warning.map(s => s.subject)
    });
    
    insights.breakdown.warning.forEach(subject => {
      const classesNeeded = calculateClassesNeeded(subject.attendedClasses, subject.totalClasses);
      insights.actionItems.push({
        subject: subject.subject,
        action: classesNeeded > 0 ? `Attend next ${classesNeeded} classes` : 'Maintain current attendance',
        priority: 'medium',
        classesNeeded
      });
    });
  }
  
  if (insights.breakdown.safe.length === attendance.length && attendance.length > 0) {
    insights.recommendations.push({
      type: 'success',
      title: 'Excellent Performance',
      message: 'All subjects have safe attendance. Keep up the great work!',
      subjects: []
    });
  }
  
  return insights;
};

/**
 * Calculate projected attendance based on future class assumptions
 * @param {Object} subject - Subject data
 * @param {number} futureClasses - Number of future classes to attend
 * @param {number} totalFutureClasses - Total number of future classes
 * @returns {Object} Projected attendance data
 */
export const calculateProjectedAttendance = (subject, futureClasses = 0, totalFutureClasses = 0) => {
  const currentAttended = subject.attendedClasses;
  const currentTotal = subject.totalClasses;
  
  const projectedAttended = currentAttended + futureClasses;
  const projectedTotal = currentTotal + totalFutureClasses;
  
  const projectedPercentage = projectedTotal > 0 
    ? (projectedAttended / projectedTotal) * 100 
    : 0;
  
  return {
    projectedAttended,
    projectedTotal,
    projectedPercentage,
    projectedStatus: getAttendanceStatus(projectedPercentage),
    improvement: projectedPercentage - subject.percentage
  };
};

/**
 * Export attendance data as CSV
 * @param {Object} attendanceData - Attendance data to export
 * @param {Object} user - User information
 * @returns {string} CSV string
 */
export const exportToCSV = (attendanceData, user) => {
  const headers = [
    'Subject',
    'Attended Classes',
    'Total Classes',
    'Percentage',
    'Status',
    'Classes Needed for 75%'
  ];
  
  const rows = attendanceData.attendance.map(subject => {
    const classesNeeded = calculateClassesNeeded(subject.attendedClasses, subject.totalClasses);
    return [
      subject.subject,
      subject.attendedClasses,
      subject.totalClasses,
      `${subject.percentage.toFixed(2)}%`,
      subject.status,
      classesNeeded
    ];
  });
  
  const csvContent = [
    `# AttendEase Report - ${user?.userId || 'Student'}`,
    `# Generated on: ${new Date().toLocaleString()}`,
    `# Overall Percentage: ${attendanceData.summary?.overallPercentage}%`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
};

/**
 * Debounce function for search and filter operations
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if attendance data is stale (older than specified time)
 * @param {string} timestamp - Data timestamp
 * @param {number} maxAgeHours - Maximum age in hours (default: 24)
 * @returns {boolean} True if data is stale
 */
export const isDataStale = (timestamp, maxAgeHours = 24) => {
  if (!timestamp) return true;
  
  const dataDate = new Date(timestamp);
  const now = new Date();
  const ageInHours = (now - dataDate) / (1000 * 60 * 60);
  
  return ageInHours > maxAgeHours;
};

export default {
  calculateClassesNeeded,
  calculateClassesCanMiss,
  getAttendanceStatus,
  formatPercentage,
  formatDate,
  validateAttendanceData,
  sortAttendanceData,
  filterAttendanceData,
  generateAttendanceInsights,
  calculateProjectedAttendance,
  exportToCSV,
  debounce,
  isDataStale
};