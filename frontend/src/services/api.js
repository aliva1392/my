import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Pricing APIs
export const pricingAPI = {
  getPricing: () => api.get('/pricing/'),
  calculatePrice: (data) => api.post('/pricing/calculate', data),
};

// Cart APIs
export const cartAPI = {
  getCart: () => api.get('/cart/'),
  addToCart: (data) => api.post('/cart/', data),
  removeFromCart: (itemId) => api.delete(`/cart/${itemId}`),
  clearCart: () => api.delete('/cart/'),
};

// Order APIs
export const orderAPI = {
  createOrder: (data) => api.post('/orders/', data),
  checkout: () => api.post('/orders/checkout'),
  getOrders: (status) => api.get('/orders/', { params: { status } }),
  getOrder: (id) => api.get(`/orders/${id}`),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
};

export default api;