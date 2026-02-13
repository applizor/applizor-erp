import api from '../api';

export interface KeyResult {
    id: string;
    title: string;
    targetValue: number;
    startValue: number;
    currentValue: number;
    unit?: string;
}

export interface OKR {
    id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    progress: number;
    status: string;
    keyResults: KeyResult[];
}

export interface PerformanceReview {
    id: string;
    employeeId: string;
    reviewerId: string;
    reviewDate: string;
    rating?: number;
    feedback?: string;
    goals?: any;
    status: string;
}

export interface ExitDetail {
    id: string;
    employeeId: string;
    resignationDate: string;
    lastWorkingDay: string;
    reason?: string;
    fnfStatus: string;
    assetRecoveryStatus: string;
}

export const performanceApi = {
    // OKRs
    getOKRs: async () => {
        const response = await api.get('/performance/okrs');
        return response.data;
    },
    createOKR: async (data: any) => {
        const response = await api.post('/performance/okrs', data);
        return response.data;
    },

    // Reviews
    createReview: async (data: any) => {
        const response = await api.post('/performance/reviews', data);
        return response.data;
    },

    // Exit
    initiateExit: async (data: any) => {
        const response = await api.post('/performance/exit', data);
        return response.data;
    },
    getFnF: async (employeeId: string) => {
        const response = await api.get(`/performance/exit/${employeeId}/fnf`);
        return response.data;
    }
};
