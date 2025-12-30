import axios from 'axios';

// Use relative URL to leverage Vite proxy, or fallback to direct URL
// The Vite proxy in vite.config.js forwards /api requests to http://localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add API key to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to extract error message from FastAPI error response
function extractErrorMessage(error) {
  const detail = error.response?.data?.detail;
  
  // If detail is an array (FastAPI validation errors)
  if (Array.isArray(detail)) {
    return detail.map(err => {
      const loc = Array.isArray(err.loc) ? err.loc.slice(1).join('.') : '';
      return `${loc ? loc + ': ' : ''}${err.msg || 'Validation error'}`;
    }).join('; ');
  }
  
  // If detail is a string
  if (typeof detail === 'string') {
    return detail;
  }
  
  // If detail is an object with a message
  if (detail && typeof detail === 'object' && detail.message) {
    return detail.message;
  }
  
  // Fallback to other error sources
  return error.response?.data?.message || error.message || 'An error occurred';
}

// Handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Preserve the full error object for error handling
    if (error.response?.status === 401) {
      // Handle unauthorized - maybe redirect to login
      localStorage.removeItem('apiKey');
    }
    
    // Extract proper error message
    const errorMessage = extractErrorMessage(error);
    
    return Promise.reject({
      ...error,
      message: errorMessage,
      response: error.response,
    });
  }
);

