import api from '../api';

export interface JobOpening {
    id: string;
    title: string;
    department?: string;
    position?: string;
    description?: string;
    requirements?: string;
    status: 'open' | 'closed' | 'on-hold';
    candidateCount?: number;
    createdAt: string;
}

export interface Candidate {
    id: string;
    jobOpeningId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    resumePath?: string;
    status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
    currentStage?: string;
    notes?: string;
    tags?: string[];
    parsedData?: any;
    createdAt: string;
    jobOpening?: JobOpening;
}

export interface Interview {
    id: string;
    candidateId: string;
    round: number;
    type: string;
    scheduledAt: string;
    interviewer?: string;
    feedback?: string;
    rating?: number;
    status: 'scheduled' | 'completed' | 'cancelled';
}

export interface OfferLetter {
    id: string;
    candidateId: string;
    position: string;
    department?: string;
    salary: number;
    startDate: string;
    status: 'pending' | 'sent' | 'accepted' | 'rejected';
    documentPath?: string;
}

export const jobOpeningsApi = {
    getAll: async () => {
        const response = await api.get('/recruitment/jobs');
        return response.data;
    },
    create: async (data: Partial<JobOpening>) => {
        const response = await api.post('/recruitment/jobs', data);
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/recruitment/jobs/${id}`);
        return response.data;
    },
    update: async (id: string, data: Partial<JobOpening>) => {
        const response = await api.put(`/recruitment/jobs/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/recruitment/jobs/${id}`);
        return response.data;
    }
};

export const candidatesApi = {
    getAll: async (jobId?: string) => {
        const response = await api.get('/recruitment/candidates', { params: { jobId } });
        return response.data;
    },
    create: async (data: Partial<Candidate>) => {
        const response = await api.post('/recruitment/candidates', data);
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/recruitment/candidates/${id}`);
        return response.data;
    },
    updateStatus: async (id: string, data: { status: string, currentStage?: string, notes?: string }) => {
        const response = await api.put(`/recruitment/candidates/${id}/status`, data);
        return response.data;
    },
    update: async (id: string, data: Partial<Candidate>) => {
        const response = await api.put(`/recruitment/candidates/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/recruitment/candidates/${id}`);
        return response.data;
    },
    parseResume: async (id: string) => {
        const response = await api.post(`/recruitment/candidates/${id}/parse`);
        return response.data;
    }
};

export const interviewsApi = {
    schedule: async (data: Partial<Interview>) => {
        const response = await api.post('/recruitment/interviews', data);
        return response.data;
    },
    reschedule: async (id: string, data: Partial<Interview>) => {
        const response = await api.put(`/recruitment/interviews/${id}/reschedule`, data);
        return response.data;
    },
    getByCandidate: async (candidateId: string) => {
        const response = await api.get(`/recruitment/candidates/${candidateId}/interviews`);
        return response.data;
    },
    updateFeedback: async (id: string, data: { feedback: string; rating: number; status: string }) => {
        const response = await api.put(`/recruitment/interviews/${id}/feedback`, data);
        return response.data;
    },
    cancel: async (id: string) => {
        const response = await api.delete(`/recruitment/interviews/${id}`);
        return response.data;
    }
};

export const offersApi = {
    create: async (data: Partial<OfferLetter>) => {
        const response = await api.post('/recruitment/offers', data);
        return response.data;
    },
    getByCandidate: async (candidateId: string) => {
        const response = await api.get(`/recruitment/candidates/${candidateId}/offer`);
        return response.data;
    },
    updateStatus: async (id: string, status: string) => {
        const response = await api.put(`/recruitment/offers/${id}/status`, { status });
        return response.data;
    }
};
