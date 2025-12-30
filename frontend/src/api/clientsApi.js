import { apiClient } from './apiClient';

export const clientsApi = {
  list: () => apiClient.get('/api/v1/clients'),
  
  get: (id) => apiClient.get(`/api/v1/clients/${id}`),
  
  create: (data) => apiClient.post('/api/v1/clients', data),
  
  update: (id, data) => apiClient.patch(`/api/v1/clients/${id}`, data),
  
  delete: (id) => apiClient.delete(`/api/v1/clients/${id}`),
};


