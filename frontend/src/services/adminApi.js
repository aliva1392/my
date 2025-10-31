import api from './api';

// Dashboard
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  
  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrderDetail: (orderId) => api.get(`/admin/orders/${orderId}`),
  updateOrderStatus: (orderId, status) => api.put(`/admin/orders/${orderId}/status`, { status }),
  
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserOrders: (userId) => api.get(`/admin/users/${userId}/orders`),
  
  // Pricing
  getPricing: () => api.get('/admin/pricing'),
  initializePricing: () => api.post('/admin/pricing/initialize'),
  updateServicePrice: (serviceId, data) => api.put(`/admin/pricing/service/${serviceId}`, data),
  updatePricingTier: (colorClassId, tierIndex, data) => api.put(`/admin/pricing/tier/${colorClassId}/${tierIndex}`, data),
};

export default adminAPI;