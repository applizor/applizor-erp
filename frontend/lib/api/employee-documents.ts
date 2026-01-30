
import api from '../api';

export interface EmployeeDocument {
    id: string;
    name: string;
    type: string; // 'id_proof', 'address_proof', 'education', 'other'
    filePath: string;
    fileSize: number;
    mimeType: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

export const employeeDocumentsApi = {
    getMine: async () => {
        const response = await api.get<EmployeeDocument[]>('/employee-documents/mine');
        return response.data;
    },

    upload: async (formData: FormData) => {
        const response = await api.post<EmployeeDocument>('/employee-documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/employee-documents/${id}`);
        return response.data;
    }
};
