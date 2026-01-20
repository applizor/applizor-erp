'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { auth } from '@/lib/auth';
import { paymentsApi, Payment } from '@/lib/api/payments';
import { useCurrency } from '@/context/CurrencyContext';
import { invoicesApi } from '@/lib/api/invoices';

export default function PaymentsPage() {
  const toast = useToast();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: '',
  });

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadPayments();
    loadInvoices();
  }, [router]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsApi.getAll({ limit: 50 });
      setPayments(response.payments || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await invoicesApi.getAll({ limit: 100 });
      setInvoices(response.invoices || []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await paymentsApi.createPaymentLink({
        invoiceId: formData.invoiceId,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
      });

      if (response.paymentLink?.short_url) {
        // Open payment link in new tab
        window.open(response.paymentLink.short_url, '_blank');
        toast.success('Payment link created! Opening in new tab...');
        setShowModal(false);
        loadPayments();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create payment link');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            + Create Payment Link
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No payments found</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <li key={payment.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Payment #{payment.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Invoice: {payment.invoiceId ? payment.invoiceId.slice(0, 8) : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Date: {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Method: {payment.paymentMethod} {payment.gateway && `(${payment.gateway})`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold mb-4">Create Payment Link</h3>
              <form onSubmit={handleCreatePaymentLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice *</label>
                  <select
                    required
                    value={formData.invoiceId}
                    onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select invoice</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber} - {formatCurrency(invoice.total)} ({invoice.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (Optional)</label>
                  <input
                    type="number"
                    placeholder="Leave empty for full invoice amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                  >
                    Create Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
