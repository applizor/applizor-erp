
import api from '../api';

export interface DocumentTemplate {
    id: string;
    name: string;
    type: string; // offer, contract, other
    content?: string;
    filePath?: string;
    variables: string[];
    isActive: boolean;
    createdAt: string;
}

export const templatesApi = {
    getAll: async () => {
        const response = await api.get<DocumentTemplate[]>('/document-templates');
        return response.data;
    },

    create: async (data: Partial<DocumentTemplate>) => {
        const response = await api.post<DocumentTemplate>('/document-templates', data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/document-templates/${id}`);
        return response.data;
    }
};
