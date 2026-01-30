import api from '../api';

export interface Ticket {
    id: string;
    subject: string;
    description: string;
    category: 'IT' | 'HR' | 'Finance' | 'Admin' | 'Other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    assignedTo?: string; // userId
    createdBy: string; // userId
    createdAt: string;
    updatedAt: string;
    creator?: {
        firstName: string;
        lastName: string;
    };
    assignee?: {
        firstName: string;
        lastName: string;
    };
}

export const ticketsApi = {
    getAll: async (status?: string) => {
        const response = await api.get('/tickets', { params: { status } });
        return response.data;
    },

    getMyTickets: async () => {
        const response = await api.get('/tickets/mine');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/tickets/${id}`);
        return response.data;
    },

    create: async (data: Partial<Ticket>) => {
        const response = await api.post('/tickets', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Ticket>) => {
        const response = await api.put(`/tickets/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/tickets/${id}`);
        return response.data;
    },

    addComment: async (id: string, text: string) => {
        const response = await api.post(`/tickets/${id}/comments`, { text });
        return response.data;
    }
};
