import React from 'react';
import LoadingScreen from './LoadingScreen';
import AttendanceCard from './AttendanceCard';
import AttendanceSummary from './AttendanceSummary';
import { exportToPDF } from '../utils/pdfExporter';

const AttendanceDashboard = ({ 
  user, 
  attendanceData, 
  isLoading, 
  onRefresh, 
  onLogout 
}) => {
  if (isLoading) {
    return <LoadingScreen message="Fetching your attendance data..." />;
  }

  if (!attendanceData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Attendance Data
          </h3>
          
          <p className="text-gray-500 mb-6">
            Click the button below to fetch your latest attendance data from the UPES portal.
          </p>
          
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Fetch Attendance
          </button>
        </div>
      </div>
    );
  }

  // Get attendance data without filtering
  const attendanceList = attendanceData.attendance || [];

  // Debug: Log the student data
  console.log('Student data received:', attendanceData.student);

  const handleExportPDF = () => {
    exportToPDF(attendanceData, user);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header and Summary Section - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Student Profile Section - 1/4 width on large screens, full width on small */}
        <div className="lg:col-span-1 col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 h-full">
            <div className="flex flex-col items-center h-full">
              {/* Dashboard Title */}
              <div className="mb-6 text-center w-full">
                <h2 className="text-xl font-bold text-gray-900">
                  Attendance Dashboard
                </h2>
              </div>

              {/* Profile Photo */}
              <div className="mb-4">
                {attendanceData.student?.profilePhoto ? (
                  <img 
                    src={attendanceData.student.profilePhoto} 
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-blue-100" style={{display: attendanceData.student?.profilePhoto ? 'none' : 'flex'}}>
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Student Information */}
              <div className="text-center mb-6 w-full">
                <h3 className="text-xl font-bold text-blue-600 mb-3 leading-tight">
                  {attendanceData.student?.name && attendanceData.student.name !== 'Unknown' 
                    ? attendanceData.student.name 
                    : 'Student Name'}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Student ID</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {attendanceData.student?.studentId && attendanceData.student.studentId !== 'Unknown' 
                        ? attendanceData.student.studentId 
                        : 'Not Available'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Course</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {attendanceData.student?.course && attendanceData.student.course !== 'Unknown' 
                        ? attendanceData.student.course 
                        : 'Not Available'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Semester</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {attendanceData.student?.semester && attendanceData.student.semester !== 'Unknown' 
                        ? attendanceData.student.semester 
                        : 'Not Available'}
                    </p>
                  </div>
                </div>

                {attendanceData.student?.status && (
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                      attendanceData.student.status.toLowerCase() === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {attendanceData.student.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Last Updated */}
              <div className="mb-4 text-center w-full">
                <p className="text-xs text-gray-500">
                  {attendanceData.metadata?.lastUpdated 
                    ? `Last Updated: ${attendanceData.metadata.lastUpdated}`
                    : `Last Updated: ${new Date(attendanceData.metadata?.requestTime || attendanceData.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex flex-col space-y-3 w-full">
                <button
                  onClick={onRefresh}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </button>
                
                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section - 3/4 width on large screens, full width on small */}
        <div className="lg:col-span-3 col-span-1">
          <AttendanceSummary summary={attendanceData.summary} />
        </div>
      </div>

      {/* Attendance Cards */}
      {attendanceList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attendanceList.map((subject, index) => (
            <AttendanceCard
              key={`${subject.subject}-${index}`}
              subject={subject}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No subjects match your current filters
          </h3>
          <p className="text-gray-500">
            Try adjusting your filter criteria to see more subjects.
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceDashboard;