import api from '../api';

export interface Payment {
  id: string;
  invoiceId?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  gateway?: string;
  transactionId?: string;
  status: string;
}

export const paymentsApi = {
  createPaymentLink: async (data: {
    invoiceId: string;
    amount?: number;
    description?: string;
  }) => {
    const response = await api.post('/payments/link', data);
    return response.data;
  },

  verifyPayment: async (data: {
    paymentId: string;
    orderId: string;
    signature: string;
  }) => {
    const response = await api.post('/payments/verify', data);
    return response.data;
  },

  getAll: async (params?: {
    invoiceId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },
};
