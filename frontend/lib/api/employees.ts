import api from '../api';

export const employeesApi = {
    getAll: async (params?: any) => {
        const response = await api.get('/hrms/employees', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/hrms/employees/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/hrms/employees', data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.put(`/hrms/employees/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/hrms/employees/${id}`);
        return response.data;
    }
};
