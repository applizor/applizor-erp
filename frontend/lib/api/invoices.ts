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

  generatePDF: async (id: string, letterheadMode?: string) => {
    const response = await api.get(`/invoices/${id}/pdf`, {
      params: { letterheadMode },
      responseType: 'blob',
    });
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/invoices/${id}/status`, { status });
    return response.data;
  },

  sendEmail: async (id: string) => {
    const response = await api.post(`/invoices/${id}/send`);
    return response.data;
  }
};
