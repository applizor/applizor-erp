import api from '../api';

export const teamsApi = {
    getAll: async () => {
        const response = await api.get('/employee-teams');
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/employee-teams/${id}`);
        return response.data;
    },
    create: async (data: { name: string; description?: string }) => {
        const response = await api.post('/employee-teams', data);
        return response.data;
    },
    update: async (id: string, data: { name?: string; description?: string; isActive?: boolean }) => {
        const response = await api.put(`/employee-teams/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/employee-teams/${id}`);
        return response.data;
    },
    addMember: async (teamId: string, employeeId: string) => {
        const response = await api.post(`/employee-teams/${teamId}/members`, { employeeId });
        return response.data;
    },
    removeMember: async (teamId: string, memberId: string) => {
        const response = await api.delete(`/employee-teams/${teamId}/members/${memberId}`);
        return response.data;
    },
};
