const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001';
const APPOINTMENT_URL = process.env.NEXT_PUBLIC_APPOINTMENT_URL || 'http://localhost:3002';
const NOTIFICATION_URL = process.env.NEXT_PUBLIC_NOTIFICATION_URL || 'http://localhost:3003';

const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server error: Invalid response format');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please check if backend services are running.');
    }
    throw error;
  }
};

export const authAPI = {
  register: (userData) => 
    apiCall(`${AUTH_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  login: (credentials) => 
    apiCall(`${AUTH_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  
  logout: () => 
    apiCall(`${AUTH_URL}/api/auth/logout`, {
      method: 'POST',
    }),
  
  getCurrentUser: () => 
    apiCall(`${AUTH_URL}/api/auth/me`),
  
  getDoctors: () => 
    apiCall(`${AUTH_URL}/api/auth/doctors`),
};

export const appointmentAPI = {
  create: (appointmentData) => 
    apiCall(`${APPOINTMENT_URL}/api/appointments`, {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    }),
  
  getAll: () => 
    apiCall(`${APPOINTMENT_URL}/api/appointments`),
  
  getById: (id) => 
    apiCall(`${APPOINTMENT_URL}/api/appointments/${id}`),
  
  updateStatus: (id, status, notes) => 
    apiCall(`${APPOINTMENT_URL}/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),
  
  cancel: (id) => 
    apiCall(`${APPOINTMENT_URL}/api/appointments/${id}/cancel`, {
      method: 'PATCH',
    }),
};

export const notificationAPI = {
  getNotifications: (userId, userType, limit = 50) => 
    apiCall(`${NOTIFICATION_URL}/api/notifications/${userId}/${userType}?limit=${limit}`),
  
  markAsRead: (notificationId) => 
    apiCall(`${NOTIFICATION_URL}/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    }),
  
  getUnreadCount: (userId, userType) => 
    apiCall(`${NOTIFICATION_URL}/api/notifications/${userId}/${userType}/unread-count`),
};