import api from '../api';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status: string;
  stage: string;
  value?: number;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
}

export const leadsApi = {
  getAll: async (params?: {
    status?: string;
    stage?: string;
    assignedTo?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/leads', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  create: async (data: Partial<Lead>) => {
    const response = await api.post('/leads', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Lead>) => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },

  convertToClient: async (id: string) => {
    const response = await api.post(`/leads/${id}/convert`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },
};
