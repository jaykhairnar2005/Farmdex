import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

/**
 * Fetch Backend API Health Status
 * @returns {Promise<{ success: boolean, message: string }>}
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
 * @returns {Promise<{ success: boolean, message: string, timestamp?: string }>}
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
