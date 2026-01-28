import api from '../api';

export interface Department {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    _count?: {
        employees: number;
        positions: number;
    };
}

export interface Position {
    id: string;
    departmentId: string;
    title: string;
    description?: string;
    isActive: boolean;
    department?: Department;
    _count?: {
        employees: number;
    };
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    employeeId: string;
    dateOfBirth?: string;
    departmentId?: string;
    positionId?: string;
    status: string;
    department?: Department;
    position?: Position;

    // User Account
    userId?: string;
    user?: any; // Avoiding circular dependency or complex type for now

    // Personal
    gender?: string;
    bloodGroup?: string;
    maritalStatus?: string;

    // Address
    currentAddress?: string;
    permanentAddress?: string;

    // Bank & Statutory
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    panNumber?: string;
    aadhaarNumber?: string;

    // Documents
    documents?: Document[];

    // Enterprise Extensions
    dateOfJoining?: string;
    employmentType?: string;
    hourlyRate?: number;
    salary?: number;
    salaryStructure?: any;
    skills?: string[] | string;
    slackMemberId?: string;
    probationEndDate?: string;
    noticePeriodStartDate?: string;
    noticePeriodEndDate?: string;
}

export interface Document {
    id: string;
    name: string;
    type: string;
    filePath: string;
    createdAt: string;
}

export const departmentsApi = {
    getAll: async () => {
        const response = await api.get('/departments');
        return response.data;
    },
    create: async (data: Partial<Department>) => {
        const response = await api.post('/departments', data);
        return response.data;
    },
    update: async (id: string, data: Partial<Department>) => {
        const response = await api.put(`/departments/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/departments/${id}`);
        return response.data;
    },
};

export const positionsApi = {
    getAll: async (departmentId?: string) => {
        const params = departmentId ? { departmentId } : {};
        const response = await api.get('/positions', { params });
        return response.data;
    },
    create: async (data: Partial<Position>) => {
        const response = await api.post('/positions', data);
        return response.data;
    },
    update: async (id: string, data: Partial<Position>) => {
        const response = await api.put(`/positions/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/positions/${id}`);
        return response.data;
    },
};

export const employeesApi = {
    getAll: async (params?: { departmentId?: string; status?: string }) => {
        const response = await api.get('/employees', { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/employees/${id}`);
        return response.data;
    },
    create: async (data: Partial<Employee>) => {
        const response = await api.post('/employees', data);
        return response.data;
    },
    update: async (id: string, data: Partial<Employee>) => {
        const response = await api.put(`/employees/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/employees/${id}`);
        return response.data;
    },
    uploadDocument: async (id: string, formData: FormData) => {
        const response = await api.post(`/employees/${id}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
