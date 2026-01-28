import api from '../api';

export interface SalesTarget {
    id: string;
    employeeId: string;
    period: string;
    startDate: string;
    endDate: string;
    targetAmount: number;
    achievedAmount: number;
    status: string;
    employee: {
        user: {
            firstName: string;
            lastName: string;
            email?: string;
        };
    };
}

export const salesApi = {
    createTarget: async (data: any) => {
        const response = await api.post('/crm/sales', data);
        return response.data;
    },

    getAllTargets: async (params?: any) => {
        const response = await api.get('/crm/sales', { params });
        return response.data;
    },

    calculateProgress: async () => {
        const response = await api.post('/crm/sales/calculate-progress');
        return response.data;
    }
};
