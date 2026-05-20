import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CertificateTemplate {
    id: string;
    companyId: string;
    name: string;
    type: 'course' | 'internship' | 'experience' | 'custom';
    content: string;
    variables: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Certificate {
    id: string;
    companyId: string;
    certificateNo: string;
    type: 'course' | 'internship' | 'experience' | 'custom';
    recipientType: 'employee' | 'candidate';
    employeeId?: string;
    candidateId?: string;
    templateId?: string;
    title: string;
    issuedDate: string;
    expiryDate?: string;
    courseName?: string;
    duration?: string;
    grade?: string;
    score?: string;
    internshipRole?: string;
    guideName?: string;
    projectName?: string;
    department?: string;
    designation?: string;
    customFields?: Record<string, string>;
    status: 'draft' | 'issued' | 'revoked';
    pdfPath?: string;
    issuedById?: string;
    remarks?: string;
    emailSentAt?: string;
    createdAt: string;
    updatedAt: string;
    // Relations
    employee?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        employeeId: string;
        department?: { name: string };
        position?: { title: string };
    };
    template?: { id: string; name: string; type: string };
}

export interface CertificateListResponse {
    data: Certificate[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreateCertificateDto {
    type: string;
    recipientType?: string;
    employeeId?: string;
    candidateId?: string;
    templateId?: string;
    title: string;
    issuedDate: string;
    expiryDate?: string;
    courseName?: string;
    duration?: string;
    grade?: string;
    score?: string;
    internshipRole?: string;
    guideName?: string;
    projectName?: string;
    department?: string;
    designation?: string;
    customFields?: Record<string, string>;
    remarks?: string;
}

// ─── Certificate Template API ─────────────────────────────────────────────────

export const certificateTemplateApi = {
    list: (params?: { type?: string; isActive?: boolean }) =>
        api.get<CertificateTemplate[]>('/certificates/templates', { params }),

    get: (id: string) =>
        api.get<CertificateTemplate>(`/certificates/templates/${id}`),

    create: (data: Partial<CertificateTemplate>) =>
        api.post<CertificateTemplate>('/certificates/templates', data),

    update: (id: string, data: Partial<CertificateTemplate>) =>
        api.put<CertificateTemplate>(`/certificates/templates/${id}`, data),

    delete: (id: string) =>
        api.delete(`/certificates/templates/${id}`),
};

// ─── Certificate API ──────────────────────────────────────────────────────────

export const certificateApi = {
    list: (params?: {
        type?: string;
        status?: string;
        employeeId?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) => api.get<CertificateListResponse>('/certificates', { params }),

    get: (id: string) =>
        api.get<Certificate>(`/certificates/${id}`),

    create: (data: CreateCertificateDto) =>
        api.post<Certificate>('/certificates', data),

    update: (id: string, data: Partial<CreateCertificateDto>) =>
        api.put<Certificate>(`/certificates/${id}`, data),

    delete: (id: string) =>
        api.delete(`/certificates/${id}`),

    issue: (id: string) =>
        api.post<Certificate>(`/certificates/${id}/issue`),

    revoke: (id: string, reason?: string) =>
        api.post<Certificate>(`/certificates/${id}/revoke`, { reason }),

    generatePdf: (id: string) =>
        api.post<{ success: boolean; pdfPath: string; message: string }>(`/certificates/${id}/generate-pdf`),

    sendEmail: (id: string) =>
        api.post<{ success: boolean; message: string }>(`/certificates/${id}/send-email`),

    downloadUrl: (id: string) =>
        `${process.env.NEXT_PUBLIC_API_URL}/certificates/${id}/download`,
};
