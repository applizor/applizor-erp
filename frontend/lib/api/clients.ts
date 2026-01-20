import api from '../api';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  status: string;
  clientType: string;
  createdAt: string;
}

export const clientsApi = {
  getAll: async (params?: {
    status?: string;
    clientType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/clients', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  create: async (data: Partial<Client>) => {
    const response = await api.post('/clients', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Client>) => {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },
};
