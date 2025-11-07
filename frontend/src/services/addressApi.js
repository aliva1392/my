import api from './api';

export const addressAPI = {
  // دریافت تمام آدرس‌های کاربر
  getAddresses: () => api.get('/addresses/'),
  
  // دریافت یک آدرس خاص
  getAddress: (addressId) => api.get(`/addresses/${addressId}`),
  
  // ایجاد آدرس جدید
  createAddress: (data) => api.post('/addresses/', data),
  
  // به‌روزرسانی آدرس
  updateAddress: (addressId, data) => api.put(`/addresses/${addressId}`, data),
  
  // حذف آدرس
  deleteAddress: (addressId) => api.delete(`/addresses/${addressId}`),
  
  // تعیین آدرس به عنوان پیش‌فرض
  setDefaultAddress: (addressId) => api.post(`/addresses/${addressId}/set-default`),
};

export default addressAPI;
