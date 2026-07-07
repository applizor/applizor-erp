import api from '../api';

export const subscriptionsApi = {
  getAll: async (params?: { status?: string; clientId?: string; search?: string }) => {
    const response = await api.get('/subscriptions', { params });
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/subscriptions', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/subscriptions/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/subscriptions/${id}`);
    return response.data;
  }
};
