import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('authToken');
      window.location.reload();
      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return Promise.reject(new Error('Request timeout. Please check your internet connection and try again.'));
    }

    if (error.code === 'ERR_NETWORK' || !error.response) {
      return Promise.reject(new Error('Network error. Please check your internet connection.'));
    }

    // Handle API errors
    const apiError = error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(apiError));
  }
);

export const authService = {
  /**
   * Login with user credentials
   * @param {Object} credentials - User credentials
   * @param {string} credentials.userId - User ID
   * @param {string} credentials.password - Password
   * @returns {Promise<Object>} Login response
   */
  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Logout user
   * @returns {Promise<Object>} Logout response
   */
  async logout() {
    try {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error for logout as it should always succeed client-side
      return { success: true };
    }
  },

  /**
   * Validate JWT token
   * @param {string} token - JWT token to validate
   * @returns {Promise<Object>} Validation response
   */
  async validateToken(token) {
    try {
      const response = await apiClient.post('/auth/validate', { token });
      return response.data;
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false, error: error.message };
    }
  },

  /**
   * Get current session information
   * @returns {Promise<Object>} Session info response
   */
  async getSessionInfo() {
    try {
      const response = await apiClient.get('/auth/session-info');
      return response.data;
    } catch (error) {
      console.error('Session info error:', error);
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  /**
   * Get stored auth token
   * @returns {string|null} Auth token
   */
  getToken() {
    return localStorage.getItem('authToken');
  },

  /**
   * Clear authentication data
   */
  clearAuth() {
    localStorage.removeItem('authToken');
  }
};

export default authService;