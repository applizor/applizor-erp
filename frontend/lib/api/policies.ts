
import api from '../api';

export interface Policy {
    id: string;
    title: string;
    description?: string;
    category?: string;
    fileUrl?: string;
    effectiveDate: string;
    isActive: boolean;
    createdAt: string;
}

export const policiesApi = {
    getAll: async () => {
        const response = await api.get<Policy[]>('/policies');
        return response.data;
    },

    create: async (data: Partial<Policy>) => {
        const response = await api.post<Policy>('/policies', data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/policies/${id}`);
        return response.data;
    }
};
