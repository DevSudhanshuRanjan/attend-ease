import React from 'react';

const AttendanceSummary = ({ summary }) => {
  if (!summary) {
    return null;
  }

  const getSummaryCards = () => [
    {
      title: 'Total Subjects',
      value: summary.totalSubjects || 0,
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-900'
    },
    {
      title: 'Safe Subjects',
      value: summary.safeSubjects || 0,
      subtitle: '≥75% attendance',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      bgColor: 'bg-green-50',
      textColor: 'text-green-900'
    },
    {
      title: 'Warning Subjects',
      value: summary.warningSubjects || 0,
      subtitle: '65-74% attendance',
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-900'
    },
    {
      title: 'Critical Subjects',
      value: summary.criticalSubjects || 0,
      subtitle: '<65% attendance',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
      bgColor: 'bg-red-50',
      textColor: 'text-red-900'
    }
  ];

  const getOverallStatus = () => {
    const percentage = parseFloat(summary.overallPercentage) || 0;
    
    if (percentage >= 75) {
      return {
        status: 'Excellent',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '🎉'
      };
    } else if (percentage >= 65) {
      return {
        status: 'Good',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '⚠️'
      };
    } else {
      return {
        status: 'Needs Attention',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '🚨'
      };
    }
  };

  const overallStatus = getOverallStatus();
  const summaryCards = getSummaryCards();

  return (
    <div className="space-y-6">
      {/* Overall Summary Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Overall Attendance Summary
          </h3>
          <div className={`flex items-center px-3 py-2 rounded-full ${overallStatus.bgColor}`}>
            <span className="mr-2">{overallStatus.icon}</span>
            <span className={`text-sm font-medium ${overallStatus.color}`}>
              {overallStatus.status}
            </span>
          </div>
        </div>

        {/* Overall Percentage */}
        <div className="text-center mb-6">
          <div className={`text-4xl font-bold mb-2 ${overallStatus.color}`}>
            {summary.overallPercentage}%
          </div>
          <div className="text-gray-600">Overall Attendance Percentage</div>
          
          {/* Progress Circle */}
          <div className="flex justify-center mt-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="transparent"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="transparent"
                  stroke={
                    parseFloat(summary.overallPercentage) >= 75 
                      ? "#10b981" 
                      : parseFloat(summary.overallPercentage) >= 65 
                        ? "#f59e0b" 
                        : "#ef4444"
                  }
                  strokeWidth="3"
                  strokeDasharray={`${parseFloat(summary.overallPercentage) * 100.53 / 100} 100.53`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-700">
                  {summary.overallPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <div key={index} className={`${card.bgColor} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                {card.icon}
                <span className={`text-2xl font-bold ${card.textColor}`}>
                  {card.value}
                </span>
              </div>
              <div className={`text-sm font-medium ${card.textColor}`}>
                {card.title}
              </div>
              {card.subtitle && (
                <div className="text-xs text-gray-600 mt-1">
                  {card.subtitle}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          📋 Recommendations
        </h4>
        
        <div className="space-y-3">
          {summary.criticalSubjects > 0 && (
            <div className="flex items-start p-3 bg-red-50 rounded-lg border border-red-200">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="text-sm font-medium text-red-800">
                  Immediate action required for {summary.criticalSubjects} subject{summary.criticalSubjects > 1 ? 's' : ''}
                </div>
                <div className="text-sm text-red-700 mt-1">
                  Contact your faculty members immediately to discuss your attendance situation.
                </div>
              </div>
            </div>
          )}

          {summary.warningSubjects > 0 && (
            <div className="flex items-start p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="text-sm font-medium text-yellow-800">
                  Focus on {summary.warningSubjects} subject{summary.warningSubjects > 1 ? 's' : ''} in warning zone
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  Attend all upcoming classes to bring your attendance above 75%.
                </div>
              </div>
            </div>
          )}

          {summary.safeSubjects === summary.totalSubjects && summary.totalSubjects > 0 && (
            <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
              <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="text-sm font-medium text-green-800">
                  Excellent! All subjects have safe attendance
                </div>
                <div className="text-sm text-green-700 mt-1">
                  Keep up the great work and maintain regular class attendance.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceSummary;