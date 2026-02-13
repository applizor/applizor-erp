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

export interface Payroll {
    id: string;
    employee: {
        firstName: string;
        lastName: string;
        employeeId: string;
        department?: { name: string };
    };
    month: number;
    year: number;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    status: 'draft' | 'paid';
    processedAt: string;
}

export interface EmployeeSalaryStructure {
    employeeId: string;
    ctc: number;
    breakdown: Record<string, number>;
}

export interface SalaryTemplate {
    id: string;
    name: string;
    description?: string;
}

export const payrollApi = {
    // ... items ...
    getList: async (month: number, year: number) => {
        const response = await api.get<Payroll[]>(`/payroll/list?month=${month}&year=${year}`);
        return response.data;
    },

    getTemplates: async () => {
        const response = await api.get<SalaryTemplate[]>('/payroll/templates');
        return response.data;
    },

    previewTemplate: async (templateId: string, ctc: number) => {
        const response = await api.post<Record<string, number>>('/payroll/templates/preview', { templateId, ctc });
        return response.data;
    },

    getMine: async () => {
        const response = await api.get<Payroll[]>('/payroll/mine');
        return response.data;
    },

    approve: async (id: string) => {
        const response = await api.post(`/payroll/${id}/approve`);
        return response.data;
    },

    downloadPayslip: async (id: string) => {
        const response = await api.get(`/payroll/${id}/payslip`, { responseType: 'blob' });
        return response.data;
    },

    emailPayslip: async (id: string) => {
        const response = await api.post(`/payroll/${id}/email-payslip`);
        return response.data;
    },

    // Structure
    getStructure: async (employeeId: string) => {
        const response = await api.get(`/payroll/structure/${employeeId}`);
        return response.data;
    },

    saveStructure: async (employeeId: string, data: any) => {
        const response = await api.post(`/payroll/structure/${employeeId}`, data);
        return response.data;
    },

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

    // Process
    process: async (data: { month: number; year: number; departmentId?: string }) => {
        const response = await api.post('/payroll/process', data);
        return response.data;
    }
};
