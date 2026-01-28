import api from '../api';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  client?: any;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export const invoicesApi = {
  getAll: async (params?: {
    status?: string;
    clientId?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: {
    clientId: string;
    invoiceDate: string;
    dueDate: string;
    items: Array<{
      description: string;
      quantity: number;
      rate: number;
    }>;
    tax?: number;
    discount?: number;
    notes?: string;
  }) => {
    const response = await api.post('/invoices', data);
    return response.data;
  },

  generatePDF: async (id: string, useLetterhead: boolean = true) => {
    const response = await api.post(`/invoices/${id}/generate-pdf`, { useLetterhead }, {
      responseType: 'blob',
    });
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.put(`/invoices/${id}/status`, { status });
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  },

  sendEmail: async (id: string, data?: { useLetterhead: boolean }) => {
    const response = await api.post(`/invoices/${id}/send`, data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/invoices/stats/summary');
    return response.data;
  },

  recordPayment: async (id: string, data: { amount: number; paymentMethod: string; transactionId?: string }) => {
    const response = await api.post(`/invoices/${id}/payments`, data);
    return response.data;
  },

  batchUpdateStatus: async (ids: string[], status: string) => {
    const response = await api.post('/invoices/batch/status', { ids, status });
    return response.data;
  },

  batchSend: async (ids: string[]) => {
    const response = await api.post('/invoices/batch/send', { ids });
    return response.data;
  },

  convertQuotation: async (id: string) => {
    const response = await api.post(`/invoices/${id}/convert`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  }
};
