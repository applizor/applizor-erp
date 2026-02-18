import api from '../api';

export interface Attendance {
    id: string;
    employeeId: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: 'present' | 'absent' | 'half-day' | 'leave' | 'late';
    notes?: string;
}

export interface LeaveType {
    id: string;
    name: string;
    days: number;
    isPaid: boolean;
    description?: string;
    monthlyLimit: number;
    maxConsecutiveDays: number;
    minServiceDays: number;
    sandwichRule: boolean;
    encashable: boolean;
    proofRequired: boolean;
    color: string;
    frequency?: 'yearly' | 'monthly';
    carryForward?: boolean;
    maxCarryForward?: number;
    // New Advanced Fields
    accrualType?: 'yearly' | 'monthly' | 'daily';
    accrualRate?: number;
    accrualStartMonth?: number;
    maxAccrual?: number;
    departmentIds?: string[];
    positionIds?: string[];
    employmentStatus?: string[];
    // Quarterly & Probation
    quarterlyLimit?: number;
    probationQuota?: number;
    confirmationBonus?: number;
    // Dynamic Policies
    policySettings?: {
        noticePeriod?: number;
        minDaysForNotice?: number;
        minDaysForProof?: number;
        includeNonWorkingDays?: boolean;
    };
}

export interface LeaveRequest {
    id: string;
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    days: number;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    approvedBy?: string;
    approvedAt?: string;
    createdAt: string;
    // New Fields
    durationType?: 'full' | 'multiple' | 'first_half' | 'second_half';
    attachmentPath?: string;
    assignedBy?: string;
    category?: string; // Sick/Casual
    leaveType?: LeaveType;
    employee?: {
        firstName: string;
        lastName: string;
        department?: {
            name: string;
        };
    };
}

export interface Holiday {
    id: string;
    name: string;
    date: string;
    type: 'national' | 'regional' | 'company';
    isActive: boolean;
}

export const attendanceApi = {
    checkIn: async (data?: { latitude?: number; longitude?: number }) => {
        const response = await api.post('/attendance-leave/check-in', data);
        return response.data;
    },
    checkOut: async () => {
        const response = await api.post('/attendance-leave/check-out');
        return response.data;
    },
    getMyAttendance: async (month?: number, year?: number) => {
        const response = await api.get('/attendance-leave/my-attendance', { params: { month, year } });
        return response.data;
    },
    todayStatus: async () => {
        const response = await api.get('/attendance-leave/today-status');
        return response.data;
    },
    getAll: async (filters?: { date?: string; departmentId?: string; employeeName?: string }) => {
        const response = await api.get('/attendance-leave/all-attendance', { params: filters });
        return response.data;
    },
    getMusterRoll: async (month: number, year: number, departmentId?: string) => {
        const response = await api.get('/attendance-leave/all-attendance', {
            params: { month, year, departmentId }
        });
        return response.data;
    },
    manualMark: async (assignments: any[]) => {
        const response = await api.post('/attendance-leave/attendance/manual', { assignments });
        return response.data;
    },
    deleteRecord: async (employeeId: string, date: string) => {
        const response = await api.delete('/attendance-leave/attendance', { params: { employeeId, date } });
        return response.data;
    }
};

export const leavesApi = {
    getTypes: async () => {
        const response = await api.get('/attendance-leave/leave-types');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/attendance-leave/leaves', data);
        return response.data;
    },
    uploadAttachment: async (formData: FormData) => {
        const response = await api.post('/attendance-leave/leaves/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getMyLeaves: async () => {
        const response = await api.get('/attendance-leave/my-leaves');
        return response.data;
    },
    getAllLeaves: async (status?: string) => {
        const response = await api.get('/attendance-leave/all-leaves', { params: { status } });
        return response.data;
    },
    updateStatus: async (id: string, status: string) => {
        const response = await api.put(`/attendance-leave/leaves/${id}/status`, { status });
        return response.data;
    },
    calculateDays: async (data: { leaveTypeId: string; startDate: string; endDate: string }) => {
        const response = await api.post('/attendance-leave/leaves/calculate', data);
        return response.data;
    },
    getMyBalances: async () => {
        const response = await api.get('/attendance-leave/my-balances');
        return response.data;
    },
    getAllBalances: async (filters?: { departmentId?: string; employeeId?: string; year?: number }) => {
        const response = await api.get('/attendance-leave/all-balances', { params: filters });
        return response.data;
    }
};

export const holidaysApi = {
    getAll: async (year?: number) => {
        const response = await api.get('/attendance-leave/holidays', { params: { year } });
        return response.data;
    },
    create: async (data: Partial<Holiday>) => {
        const response = await api.post('/attendance-leave/holidays', data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/attendance-leave/holidays/${id}`);
        return response.data;
    }
};

export const leaveTypesApi = {
    getAll: async () => {
        const response = await api.get('/attendance-leave/leave-types');
        return response.data;
    },
    create: async (data: Partial<LeaveType>) => {
        const response = await api.post('/attendance-leave/leave-types', data);
        return response.data;
    },
    update: async (id: string, data: Partial<LeaveType>) => {
        const response = await api.put(`/attendance-leave/leave-types/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/attendance-leave/leave-types/${id}`);
        return response.data;
    }
};

export const rostersApi = {
    getRoster: async (startDate: string, endDate: string, departmentId?: string) => {
        const response = await api.get('/shift-rosters', { params: { startDate, endDate, departmentId } });
        return response.data;
    },
    updateBatch: async (assignments: { employeeId: string; shiftId: string; date: string }[]) => {
        const response = await api.post('/shift-rosters/batch', { assignments });
        return response.data;
    }
};
