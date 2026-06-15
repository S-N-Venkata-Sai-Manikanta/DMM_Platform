import api from './client.js';

export const authApi = {
  setupStatus: () => api.get('/auth/setup-status').then((r) => r.data),
  setup: (data) => api.post('/auth/setup', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const userApi = {
  list: (params) => api.get('/users', { params }).then((r) => r.data),
  get: (id) => api.get(`/users/${id}`).then((r) => r.data),
  create: (data) => api.post('/users', data).then((r) => r.data),
  update: (id, data) => api.put(`/users/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`).then((r) => r.data),
  resetPassword: (id, password) => api.put(`/users/${id}/reset-password`, { password }).then((r) => r.data),
  // self
  updateProfile: (formData) =>
    api.put('/users/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  changePassword: (data) => api.put('/users/password', data).then((r) => r.data),
  updateSettings: (data) => api.put('/users/settings', data).then((r) => r.data),
};

export const analyticsApi = {
  get: () => api.get('/analytics').then((r) => r.data),
  history: (platform) => api.get(`/analytics/${platform}/history`).then((r) => r.data),
  record: (data) => api.post('/analytics', data).then((r) => r.data),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats').then((r) => r.data),
  activity: () => api.get('/dashboard/activity').then((r) => r.data),
};

export const activityApi = {
  list: (params) => api.get('/activity', { params }).then((r) => r.data),
};
