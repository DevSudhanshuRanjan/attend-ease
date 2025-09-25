import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import AttendanceDashboard from './components/AttendanceDashboard';
import LoadingScreen from './components/LoadingScreen';
import ErrorMessage from './components/ErrorMessage';
import { authService } from './services/authService';
import { attendanceService } from './services/attendanceService';

function App() {
  // State management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [error, setError] = useState(null);
  const [fetchingAttendance, setFetchingAttendance] = useState(false);

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const isValid = await authService.validateToken(token);
          if (isValid.valid) {
            setIsAuthenticated(true);
            setUser(isValid.user);
          } else {
            localStorage.removeItem('authToken');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle login
  const handleLogin = async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);
      
      if (response.success) {
        localStorage.setItem('authToken', response.token);
        setIsAuthenticated(true);
        setUser(response.user);
        
        // Auto-fetch attendance after successful login
        await handleFetchAttendance(credentials.password);
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      setUser(null);
      setAttendanceData(null);
      setError(null);
      setIsLoading(false);
    }
  };

  // Handle attendance fetching
  const handleFetchAttendance = async (password) => {
    if (!password) {
      setError('Password is required to fetch attendance data');
      return;
    }

    setFetchingAttendance(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await attendanceService.fetchAttendance({ password }, token);
      
      if (response.success) {
        setAttendanceData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch attendance data');
      }
    } catch (error) {
      console.error('Attendance fetch failed:', error);
      setError(error.message || 'Failed to fetch attendance data. Please try again.');
    } finally {
      setFetchingAttendance(false);
    }
  };

  // Handle retry attendance fetch
  const handleRetryAttendance = () => {
    // For retry, we need the password again for security
    const password = prompt('Please enter your password again to fetch attendance:');
    if (password) {
      handleFetchAttendance(password);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Loading screen
  if (isLoading) {
    return <LoadingScreen message="Initializing application..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex-1"></div>
            
            <div className="flex-1 flex justify-center">
              <h1 className="text-3xl font-bold text-gray-900">
                <span className="text-blue-600">Attend</span>Ease
              </h1>
            </div>
            
            <div className="flex-1 flex justify-end">
              {isAuthenticated && user && (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <ErrorMessage
            message={error}
            onClose={clearError}
            className="mb-6"
          />
        )}

        {/* Authentication Flow */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Sign In
                </h2>
                <p className="text-gray-600">
                  Enter your UPES Beta Portal credentials
                </p>
              </div>
              
              <LoginForm 
                onSubmit={handleLogin}
                isLoading={isLoading}
              />
            </div>
            
            {/* Features */}
            <div className="mt-8 text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-blue-600 font-semibold mb-1">🔒 Secure</div>
                  <div>Your credentials are encrypted and never stored</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-green-600 font-semibold mb-1">⚡ Fast</div>
                  <div>Fetching your latest attendance data...</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-purple-600 font-semibold mb-1">📊 Smart</div>
                  <div>Detailed analysis and attendance insights</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AttendanceDashboard
            user={user}
            attendanceData={attendanceData}
            isLoading={fetchingAttendance}
            onRefresh={handleRetryAttendance}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>
              © 2025 AttendEase. Made for UPES students. 
              <span className="ml-2 text-red-500">❤️</span>
            </p>
            <p className="mt-1">
              <span className="font-medium">Disclaimer:</span> This tool fetches data from UPES Beta Portal. 
              Always verify attendance with official sources.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;