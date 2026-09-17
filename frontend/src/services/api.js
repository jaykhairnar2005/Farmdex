import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Automatically attach Bearer token to all outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Automatically clear token on 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      tokenStorage.removeToken();
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch Backend API Health Status
 */
export async function fetchApiHealth() {
  try {
    const response = await apiClient.get('/api/health');
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'API connection failed',
    };
  }
}

/**
 * Fetch Database Connection Health Status
 */
export async function fetchDbHealth() {
  try {
    const response = await apiClient.get('/api/health/db');
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Database connection unreachable',
    };
  }
}

/**
 * Register User API call
 */
export async function registerApi(registerData) {
  const response = await apiClient.post('/api/auth/register', registerData);
  return response.data;
}

/**
 * Login User API call
 */
export async function loginApi(email, password) {
  const response = await apiClient.post('/api/auth/login', { email, password });
  return response.data;
}

/**
 * Get Authenticated User Profile API call
 */
export async function getMeApi() {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
}
