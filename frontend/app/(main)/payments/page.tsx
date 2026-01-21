'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { Plus, X, ExternalLink, CreditCard, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
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
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 px-2">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-3">
            Financial Settlement
            {!loading && payments.length > 0 && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase font-black tracking-widest">
                {payments.length} TRANSACTIONS
              </span>
            )}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Auditing of transaction logs and revenue settlement lifecycle.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus size={16} className="mr-2" /> Issue Payment Link
        </button>
      </div>

      <div className="mx-2">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl shimmer" />)}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20 glass rounded-[2rem] border-dashed border-2 border-slate-200">
            <div className="text-3xl mb-4">💳</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No settlement data</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {payments.map((payment) => (
              <div key={payment.id} className="ent-card p-4 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-[2rem] -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110" />
                <div className="relative z-10 flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-slate-900 tracking-tight">
                      TXN-{payment.id.slice(0, 8).toUpperCase()}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <CreditCard size={12} className="text-slate-400" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {payment.paymentMethod || 'Gateway'} • {payment.gateway || 'Network'}
                      </span>
                    </div>
                  </div>
                  <div className={`ent-badge ${getStatusBadge(payment.status)}`}>
                    {payment.status}
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Valuation:</span>
                  <span className="text-xl font-black text-slate-900 tracking-tighter">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between relative z-10 border-t border-slate-50 pt-3">
                  <div className="space-y-0.5">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Mapped Entity</div>
                    <div className="text-[10px] font-black text-indigo-600">
                      INV-{payment.invoiceId ? payment.invoiceId.slice(0, 8).toUpperCase() : 'ORPHANED'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">ISO Timestamp</div>
                    <div className="text-[10px] font-bold text-slate-600">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal - Redesigned for High Density */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Issue Payment Protocol
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreatePaymentLink} className="space-y-5">
                <div className="ent-form-group">
                  <label className="ent-label">Mapped Document (Invoice) *</label>
                  <select
                    required
                    value={formData.invoiceId}
                    onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                    className="ent-input"
                  >
                    <option value="">Select Target Invoice</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber} - {formatCurrency(invoice.total)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ent-form-group">
                  <label className="ent-label">Override Valuation (Amount)</label>
                  <div className="relative flex items-center">
                    <DollarSign size={14} className="absolute left-3.5 text-slate-400" />
                    <input
                      type="number"
                      placeholder="Leave empty for full ledger value"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="ent-input pl-10"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    <ExternalLink size={14} className="mr-2" />
                    Execute Protocol
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility for status badges
const getStatusBadge = (status: string) => {
  const s = status?.toLowerCase();
  if (s === 'success' || s === 'completed') return 'ent-badge-success';
  if (s === 'pending' || s === 'processing') return 'ent-badge-warning';
  if (s === 'failed' || s === 'error') return 'ent-badge-danger';
  return 'ent-badge-neutral';
};
