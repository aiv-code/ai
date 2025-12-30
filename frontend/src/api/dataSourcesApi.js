import { apiClient } from './apiClient';

export const dataSourcesApi = {
  list: () => apiClient.get('/api/v1/data-sources'),
  
  get: (id) => apiClient.get(`/api/v1/data-sources/${id}`),
  
  create: (data) => apiClient.post('/api/v1/data-sources', data),
  
  update: (id, data) => apiClient.patch(`/api/v1/data-sources/${id}`, data),
  
  delete: (id) => apiClient.delete(`/api/v1/data-sources/${id}`),
  
  uploadFile: (formData) => 
    apiClient.post('/api/v1/data-sources/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  getPreview: (dataSourceId, limit = 10) =>
    apiClient.get(`/api/v1/data-sources/${dataSourceId}/preview`, { 
      params: { limit } 
    }),
};

