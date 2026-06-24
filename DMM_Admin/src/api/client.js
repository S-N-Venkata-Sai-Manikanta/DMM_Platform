import axios from 'axios';

// Admin portal uses its own token storage key so it never clashes with the
// main product app's session.
export const TOKEN_KEY = 'dmm_admin_token';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Attach the admin's currently-selected organization for org-scoped endpoints,
  // unless the call already specifies one explicitly.
  const orgId = localStorage.getItem('dmm_admin_selected_org');
  if (orgId && !config.params?.organizationId) {
    config.headers['x-organization-id'] = orgId;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
