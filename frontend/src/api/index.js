import axios from 'axios';

const API_KEY = localStorage.getItem('api_key') || '';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'X-Api-Key': API_KEY },
});

api.interceptors.request.use(cfg => {
  cfg.headers['X-Api-Key'] = localStorage.getItem('api_key') || '';
  return cfg;
});

api.interceptors.response.use(
  r => r.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('api_key');
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data?.error || err.message);
  }
);

export const phones = {
  list: params => api.get('/phones', { params }),
  get: id => api.get(`/phones/${id}`),
  create: data => api.post('/phones', data),
  update: (id, data) => api.put(`/phones/${id}`, data),
  remove: id => api.delete(`/phones/${id}`),
  queryBalance: id => api.post(`/phones/${id}/query-balance`),
  recharge: (id, amount) => api.post(`/phones/${id}/recharge`, { amount }),
  rules: id => api.get(`/phones/${id}/rules`),
};

export const balance = {
  queryAll: () => api.post('/balance/query-all'),
  history: (phoneId, params) => api.get(`/balance/history/${phoneId}`, { params }),
  summary: () => api.get('/balance/summary'),
};

export const recharge = {
  logs: params => api.get('/recharge/logs', { params }),
  retry: id => api.post(`/recharge/logs/${id}/retry`),
};

export const rules = {
  list: params => api.get('/rules', { params }),
  create: data => api.post('/rules', data),
  update: (id, data) => api.put(`/rules/${id}`, data),
  remove: id => api.delete(`/rules/${id}`),
  toggle: id => api.patch(`/rules/${id}/toggle`),
};

export const config = {
  list: () => api.get('/config'),
  set: (key, value, encrypted) => api.put(`/config/${key}`, { value, encrypted }),
  testAdapter: () => api.post('/config/test-adapter'),
};

export default api;
