import api from '../api';

export interface SalaryComponent {
    id: string;
    name: string;
    type: 'earning' | 'deduction';
    calculationType: 'flat' | 'percentage_basic';
    defaultValue: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const payrollApi = {
    // Components
    getComponents: async () => {
        const response = await api.get<SalaryComponent[]>('/payroll/components');
        return response.data;
    },

    createComponent: async (data: Partial<SalaryComponent>) => {
        const response = await api.post<SalaryComponent>('/payroll/components', data);
        return response.data;
    },

    updateComponent: async (id: string, data: Partial<SalaryComponent>) => {
        const response = await api.put<SalaryComponent>(`/payroll/components/${id}`, data);
        return response.data;
    },

    deleteComponent: async (id: string) => {
        const response = await api.delete(`/payroll/components/${id}`);
        return response.data;
    },

    // Structure
    getEmployeeStructure: async (employeeId: string) => {
        const response = await api.get(`/payroll/structure/${employeeId}`);
        return response.data;
    },

    updateEmployeeStructure: async (employeeId: string, data: any) => {
        const response = await api.put(`/payroll/structure/${employeeId}`, data);
        return response.data;
    },

    // Process
    process: async (data: { month: number; year: number; departmentId?: string }) => {
        const response = await api.post('/payroll/process', data);
        return response.data;
    }
};
