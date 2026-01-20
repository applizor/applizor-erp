import api from '../api';

export interface DocumentTemplate {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    type: string; // OfferLetter, Payslip
    filePath: string;
    letterheadMode: 'NONE' | 'FIRST_PAGE' | 'ALL_PAGES';
    isActive: boolean;
    createdAt: string;
}

export const documentTemplatesApi = {
    getAll: async () => {
        const response = await api.get('/document-templates');
        return response.data;
    },
    upload: async (formData: FormData) => {
        const response = await api.post('/document-templates', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/document-templates/${id}`);
        return response.data;
    }
};
