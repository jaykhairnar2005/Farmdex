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
 * Health Check Endpoints
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
 * Authentication Endpoints
 */
export async function registerApi(registerData) {
  const response = await apiClient.post('/api/auth/register', registerData);
  return response.data;
}

export async function loginApi(email, password) {
  const response = await apiClient.post('/api/auth/login', { email, password });
  return response.data;
}

export async function getMeApi() {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
}

/**
 * Profile Management Endpoints
 */
export async function getMeProfileApi() {
  const response = await apiClient.get('/api/profiles/me');
  return response.data;
}

export async function updateFarmerProfileApi(data) {
  const response = await apiClient.put('/api/profiles/farmer', data);
  return response.data;
}

export async function updateBuyerProfileApi(data) {
  const response = await apiClient.put('/api/profiles/buyer', data);
  return response.data;
}

/**
 * Farm CRUD Endpoints (Farmer Only)
 */
export async function createFarmApi(data) {
  const response = await apiClient.post('/api/farms', data);
  return response.data;
}

export async function getFarmsApi() {
  const response = await apiClient.get('/api/farms');
  return response.data;
}

export async function getFarmByIdApi(id) {
  const response = await apiClient.get(`/api/farms/${id}`);
  return response.data;
}

export async function updateFarmApi(id, data) {
  const response = await apiClient.put(`/api/farms/${id}`, data);
  return response.data;
}

export async function deleteFarmApi(id) {
  const response = await apiClient.delete(`/api/farms/${id}`);
  return response.data;
}

/**
 * Category Endpoints (Milestone 4)
 */
export async function fetchCategoriesApi() {
  const response = await apiClient.get('/api/categories');
  return response.data;
}

/**
 * Crop Listing Endpoints (Milestone 4)
 */
export async function fetchCropListingsApi(params = {}) {
  const response = await apiClient.get('/api/crop-listings', { params });
  return response.data;
}

export async function fetchCropListingByIdApi(id) {
  const response = await apiClient.get(`/api/crop-listings/${id}`);
  return response.data;
}

export async function fetchMyCropListingsApi(params = {}) {
  const response = await apiClient.get('/api/crop-listings/mine', { params });
  return response.data;
}

export async function createCropListingApi(data) {
  const response = await apiClient.post('/api/crop-listings', data);
  return response.data;
}

export async function updateCropListingApi(id, data) {
  const response = await apiClient.put(`/api/crop-listings/${id}`, data);
  return response.data;
}

export async function updateListingStatusApi(id, status) {
  const response = await apiClient.patch(`/api/crop-listings/${id}/status`, { status });
  return response.data;
}

export async function uploadListingImageApi(id, formData) {
  // Let browser automatically set multipart boundary
  const response = await apiClient.post(`/api/crop-listings/${id}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function deleteListingImageApi(id, imageId) {
  const response = await apiClient.delete(`/api/crop-listings/${id}/images/${imageId}`);
  return response.data;
}

export async function deleteCropListingApi(id) {
  const response = await apiClient.delete(`/api/crop-listings/${id}`);
  return response.data;
}

/**
 * Offer & Price Negotiation Endpoints (Milestone 5)
 */
export async function createOfferApi(data) {
  const response = await apiClient.post('/api/offers', data);
  return response.data;
}

export async function fetchMyOffersApi(params = {}) {
  const response = await apiClient.get('/api/offers/my', { params });
  return response.data;
}

export async function fetchFarmerOffersApi(params = {}) {
  const response = await apiClient.get('/api/offers/farmer', { params });
  return response.data;
}

export async function fetchListingOffersApi(listingId) {
  const response = await apiClient.get(`/api/offers/listing/${listingId}`);
  return response.data;
}

export async function fetchOfferByIdApi(id) {
  const response = await apiClient.get(`/api/offers/${id}`);
  return response.data;
}

export async function acceptOfferApi(id) {
  const response = await apiClient.patch(`/api/offers/${id}/accept`);
  return response.data;
}

export async function rejectOfferApi(id, reason = '') {
  const response = await apiClient.patch(`/api/offers/${id}/reject`, { reason });
  return response.data;
}

export async function counterOfferApi(id, data) {
  const response = await apiClient.patch(`/api/offers/${id}/counter`, data);
  return response.data;
}

export async function cancelOfferApi(id) {
  const response = await apiClient.patch(`/api/offers/${id}/cancel`);
  return response.data;
}

/**
 * Order & Checkout Endpoints (Milestone 6)
 */
export async function createOrderApi(data) {
  const response = await apiClient.post('/api/orders', data);
  return response.data;
}

export async function fetchMyOrdersApi(params = {}) {
  const response = await apiClient.get('/api/orders/my', { params });
  return response.data;
}

export async function fetchFarmerOrdersApi(params = {}) {
  const response = await apiClient.get('/api/orders/farmer', { params });
  return response.data;
}

export async function fetchOrderByIdApi(id) {
  const response = await apiClient.get(`/api/orders/${id}`);
  return response.data;
}

/**
 * Payment & Razorpay Endpoints (Milestone 7)
 */
export async function createPaymentOrderApi(data) {
  const response = await apiClient.post('/api/payments/create-order', data);
  return response.data;
}

export async function verifyPaymentApi(data) {
  const response = await apiClient.post('/api/payments/verify', data);
  return response.data;
}

export async function fetchOrderPaymentApi(orderId) {
  const response = await apiClient.get(`/api/payments/order/${orderId}`);
  return response.data;
}

export async function generateTestPaymentSignatureApi(data) {
  const response = await apiClient.post('/api/payments/test-mode-signature', data);
  return response.data;
}

/**
 * Delivery Tracking Endpoints (Milestone 8)
 */
export async function dispatchOrderApi(orderId, data) {
  const response = await apiClient.post(`/api/deliveries/${orderId}/dispatch`, data);
  return response.data;
}

export async function updateDeliveryStatusApi(orderId, data) {
  const response = await apiClient.patch(`/api/deliveries/${orderId}/status`, data);
  return response.data;
}

export async function fetchDeliveryTrackingApi(orderId) {
  const response = await apiClient.get(`/api/deliveries/${orderId}`);
  return response.data;
}

/**
 * Admin Panel Endpoints
 */
export async function fetchAdminStatsApi() {
  const response = await apiClient.get('/api/admin/stats');
  return response.data;
}

export async function fetchAdminUsersApi(params = {}) {
  const response = await apiClient.get('/api/admin/users', { params });
  return response.data;
}

export async function updateUserStatusApi(userId, data) {
  const response = await apiClient.patch(`/api/admin/users/${userId}/status`, data);
  return response.data;
}

export async function updateUserVerificationApi(userId, data) {
  const response = await apiClient.patch(`/api/admin/users/${userId}/verification`, data);
  return response.data;
}

export async function fetchAdminListingsApi(params = {}) {
  const response = await apiClient.get('/api/admin/listings', { params });
  return response.data;
}

export async function moderateListingApi(listingId, data) {
  const response = await apiClient.patch(`/api/admin/listings/${listingId}/moderate`, data);
  return response.data;
}

export async function fetchAdminOrdersApi(params = {}) {
  const response = await apiClient.get('/api/admin/orders', { params });
  return response.data;
}

export async function fetchAdminPaymentsApi(params = {}) {
  const response = await apiClient.get('/api/admin/payments', { params });
  return response.data;
}

export async function fetchAdminDeliveriesApi(params = {}) {
  const response = await apiClient.get('/api/admin/deliveries', { params });
  return response.data;
}

export async function fetchAdminComplaintsApi(params = {}) {
  const response = await apiClient.get('/api/admin/complaints', { params });
  return response.data;
}

export async function updateComplaintApi(complaintId, data) {
  const response = await apiClient.patch(`/api/admin/complaints/${complaintId}`, data);
  return response.data;
}

export async function submitComplaintApi(data) {
  const response = await apiClient.post('/api/complaints', data);
  return response.data;
}

export async function fetchAdminAuditLogsApi(params = {}) {
  const response = await apiClient.get('/api/admin/audit-logs', { params });
  return response.data;
}

/**
 * Real-Time Messaging & Chat Endpoints (Milestone 9)
 */
export async function fetchConversationsApi() {
  const response = await apiClient.get('/api/conversations');
  return response.data;
}

export async function startConversationApi(recipientId) {
  const response = await apiClient.post('/api/conversations', { recipientId });
  return response.data;
}

export async function fetchMessagesApi(conversationId, params = {}) {
  const response = await apiClient.get(`/api/conversations/${conversationId}/messages`, { params });
  return response.data;
}

export async function sendMessageApi(conversationId, content) {
  const response = await apiClient.post(`/api/conversations/${conversationId}/messages`, { content });
  return response.data;
}

export async function markConversationReadApi(conversationId) {
  const response = await apiClient.patch(`/api/conversations/${conversationId}/read`);
  return response.data;
}

/**
 * Notification Endpoints (Milestone 9)
 */
export async function fetchNotificationsApi(params = {}) {
  const response = await apiClient.get('/api/notifications', { params });
  return response.data;
}

export async function markNotificationReadApi(notificationId) {
  const response = await apiClient.patch(`/api/notifications/${notificationId}/read`);
  return response.data;
}

export async function markAllNotificationsReadApi() {
  const response = await apiClient.patch('/api/notifications/read-all');
  return response.data;
}
