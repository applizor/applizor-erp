import api from '../api';

export const employeesApi = {
    getAll: async (params?: any) => {
        const response = await api.get('/employees', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/employees/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/employees', data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.put(`/employees/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/employees/${id}`);
        return response.data;
    }
};
