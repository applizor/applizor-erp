import api from '../api';

export interface QuotationHiearchyItem {
    description: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
    tax?: number;
    taxRateId?: string;
    taxRateIds?: string[];
    discount: number;
    total: number;
}

export interface Quotation {
    id: string;
    quotationNumber: string;
    title: string;
    description?: string;
    leadId?: string;
    clientId?: string;
    lead?: {
        id: string;
        name: string;
        company?: string;
    };
    client?: {
        id: string;
        name: string;
    };
    quotationDate: string;
    validUntil: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    items: QuotationHiearchyItem[];
    paymentTerms?: string;
    deliveryTerms?: string;
    notes?: string;
    convertedToInvoiceId?: string;
    convertedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export const quotationsApi = {
    getAll: async (params?: {
        status?: string;
        leadId?: string;
        clientId?: string;
        page?: number;
        limit?: number;
    }) => {
        const response = await api.get('/quotations', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/quotations/${id}`);
        return response.data;
    },

    create: async (data: Partial<Quotation> & { items: Partial<QuotationHiearchyItem>[] }) => {
        const response = await api.post('/quotations', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Quotation>) => {
        const response = await api.put(`/quotations/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/quotations/${id}`);
        return response.data;
    },

    convertToInvoice: async (id: string) => {
        const response = await api.post(`/quotations/${id}/convert-to-invoice`);
        return response.data;
    },

    generatePDF: async (id: string, useLetterhead: boolean = true) => {
        const response = await api.get(`/quotations/${id}/pdf`, {
            params: { useLetterhead },
            responseType: 'blob'
        });
        return response.data;
    }
};
