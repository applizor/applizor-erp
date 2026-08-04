'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Plus, Eye, Download, Mail, Filter,
  TrendingUp, Clock, AlertCircle, CheckCircle2,
  Calendar, MoreVertical, ChevronRight, FileText,
  DollarSign, Receipt, Info
} from 'lucide-react';
import { invoicesApi } from '@/lib/api/invoices';
import { clientsApi } from '@/lib/api/clients';
import { useToast } from '@/hooks/useToast';
import { useCurrency } from '@/context/CurrencyContext';
import { InvoiceListSkeleton } from '@/components/invoices/InvoiceListSkeleton';
import { Button } from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function InvoicesPage() {
  const toast = useToast();
  const { formatCurrency } = useCurrency();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', clientId: '', startDate: '', endDate: '' });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [clientsRes, statsRes] = await Promise.all([
        clientsApi.getAll({ limit: 100 }),
        invoicesApi.getStats()
      ]);
      setClients(clientsRes.clients || []);
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to fetch metadata', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadInvoices();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [search, filters, overdueOnly]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoicesApi.getAll({
        status: filters.status || undefined,
        clientId: filters.clientId || undefined,
        search: search || undefined,
        limit: 200,
      } as any);
      let list = data.invoices || [];

      if (filters.startDate) {
        const start = new Date(filters.startDate);
        list = list.filter((inv: any) => new Date(inv.issueDate || inv.invoiceDate || inv.createdAt) >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        list = list.filter((inv: any) => new Date(inv.issueDate || inv.invoiceDate || inv.createdAt) <= end);
      }
      if (overdueOnly) {
        const now = new Date();
        list = list.filter((inv: any) => {
          if (['paid', 'cancelled', 'draft'].includes(inv.status)) return false;
          if (inv.status === 'overdue') return true;
          return inv.dueDate && new Date(inv.dueDate) < now;
        });
      }

      setInvoices(list);
      setSelectedIds([]);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const statusStyles: Record<string, { bg: string, text: string, icon: any }> = {
    draft: { bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock },
    sent: { bg: 'bg-blue-50', text: 'text-blue-700', icon: TrendingUp },
    paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
    partial: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Info },
    overdue: { bg: 'bg-rose-50', text: 'text-rose-700', icon: AlertCircle },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle },
  };

  const renderStatCard = (title: string, value: string | number, icon: any, colorClass: string, subValue?: string) => (
    <div className="ent-card p-4 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] leading-none">{title}</p>
          <h3 className="text-xl font-black text-gray-900 leading-tight">{value}</h3>
          {subValue && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{subValue}</p>}
        </div>
        <div className={`p-2 rounded-md ${colorClass} bg-opacity-10 text-${colorClass.split('-')[1]}-600 shadow-sm transition-transform group-hover:scale-105`}>
          {icon}
        </div>
      </div>
    </div>
  );

  /* Delete Logic */
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await invoicesApi.delete(deleteId);
      toast.success('Invoice deleted successfully');
      setDeleteId(null);
      loadInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete invoice');
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await invoicesApi.cancel(cancelId);
      toast.success('Invoice cancelled successfully');
      setCancelId(null);
      loadInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel invoice');
    }
  };

  return (
    <div className="space-y-4">
      {/* Standardized Header */}
      <PageHeader
        title="Commercial Ledger"
        subtitle="Operational view of revenue generation and collections"
        icon={Receipt}
        actions={
          <Link href="/invoices/create">
            <Button variant="primary" icon={Plus} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2">
              Create Invoice
            </Button>
          </Link>
        }
      />

      {/* Global Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderStatCard('Pending Drafts', stats?.byStatus?.find((s: any) => s.status === 'draft')?._count || 0, <Clock size={16} />, 'bg-slate-500', 'Work in progress')}
        {renderStatCard('Receivables', formatCurrency(stats?.byStatus?.filter((s: any) => s.status !== 'paid' && s.status !== 'cancelled').reduce((acc: any, s: any) => acc + Number(s._sum.total), 0) || 0), <TrendingUp size={16} />, 'bg-primary-500', 'Awaiting clearance')}
        {renderStatCard('Defaulted', formatCurrency(stats?.overdueAmount || 0), <AlertCircle size={16} />, 'bg-rose-500', `${stats?.overdueCount || 0} Critical units`)}
        {renderStatCard('Liquidity', formatCurrency(stats?.byStatus?.reduce((acc: any, s: any) => acc + Number(s._sum.paidAmount || 0), 0) || 0), <DollarSign size={16} />, 'bg-emerald-500', 'Realised revenue')}
      </div>

      {/* Operations Toolbar */}
      <div className="space-y-2">
        <div className="ent-card p-3 flex flex-col lg:flex-row items-center gap-3 bg-gray-50/50">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search documents, entities or financial markers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md text-xs font-bold focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <CustomSelect
              options={[
                { label: 'All Statuses', value: '' },
                ...Object.keys(statusStyles).map(s => ({ label: s.toUpperCase(), value: s }))
              ]}
              value={filters.status}
              onChange={val => setFilters({ ...filters, status: val })}
              className="flex-1 lg:flex-none"
            />
            <CustomSelect
              options={[
                { label: 'All Consumers', value: '' },
                ...clients.map(c => ({ label: c.name, value: c.id }))
              ]}
              value={filters.clientId}
              onChange={val => setFilters({ ...filters, clientId: val })}
              className="flex-1 lg:flex-none"
            />
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={`p-2 border rounded-md transition-colors ${showAdvanced || overdueOnly || filters.startDate || filters.endDate ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-100'}`}
              title="Advanced filters"
            >
              <Filter size={14} />
            </button>
          </div>
        </div>
        {showAdvanced && (
          <div className="ent-card p-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">From</label>
              <input
                type="date"
                className="ent-input text-xs"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">To</label>
              <input
                type="date"
                className="ent-input text-xs"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md cursor-pointer">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Overdue only</span>
            </label>
            {(filters.startDate || filters.endDate || overdueOnly) && (
              <button
                type="button"
                onClick={() => {
                  setFilters({ ...filters, startDate: '', endDate: '' });
                  setOverdueOnly(false);
                }}
                className="text-[10px] font-black uppercase tracking-widest text-primary-600"
              >
                Clear advanced
              </button>
            )}
          </div>
        )}
      </div>

      {/* Data Visualization Grid */}
      <div className="ent-card overflow-hidden">
        {loading && invoices.length === 0 ? (
          <InvoiceListSkeleton />
        ) : invoices.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-md flex items-center justify-center mb-4">
              <FileText size={32} className="text-gray-200" />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">No Documents Found</h3>
            <p className="text-xs text-gray-400 font-medium mt-1">Adjustment of filters may yield results</p>
          </div>
        ) : (
          <div className="ent-table-container">
            <table className="ent-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === invoices.length && invoices.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(invoices.map(i => i.id));
                        else setSelectedIds([]);
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </th>
                  <th className="text-[10px] uppercase tracking-widest">Identifier</th>
                  <th className="text-[10px] uppercase tracking-widest">Consignee</th>
                  <th className="text-[10px] uppercase tracking-widest">Temporal scope</th>
                  <th className="text-[10px] uppercase tracking-widest text-right">Valuation</th>
                  <th className="text-[10px] uppercase tracking-widest text-center">Protocol</th>
                  <th className="text-[10px] uppercase tracking-widest text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-5">
                {invoices.map((invoice) => {
                  const StatusIcon = statusStyles[invoice.status]?.icon || Info;
                  const isSelected = selectedIds.includes(invoice.id);
                  return (
                    <tr key={invoice.id} className={`group hover:bg-primary-50/30 transition-colors ${isSelected ? 'bg-primary-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setSelectedIds(prev => prev.includes(invoice.id) ? prev.filter(i => i !== invoice.id) : [...prev, invoice.id])}
                          className="rounded-md border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center font-black text-[10px] ${invoice.type === 'quotation' ? 'text-amber-600' : 'text-primary-600'}`}>
                            {invoice.type === 'quotation' ? 'QT' : 'IN'}
                          </div>
                          <div>
                            <Link href={`/invoices/${invoice.id}`} className="text-xs font-black text-gray-900 hover:text-primary-600 transition-colors">
                              {invoice.invoiceNumber}
                            </Link>
                            {invoice.isRecurring && (
                              <div className="text-[8px] font-black text-primary-500 uppercase tracking-tighter mt-0.5">Automated Cycle</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-gray-900 truncate max-w-[180px]">{invoice.client?.name}</div>
                        <div className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{invoice.client?.email || 'System Default'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
                            <Calendar size={10} className="text-gray-400" />
                            {new Date(invoice.invoiceDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                          <div className={`flex items-center gap-1 text-[10px] font-bold ${invoice.status === 'overdue' ? 'text-rose-600' : 'text-gray-400'}`}>
                            <Clock size={10} />
                            {new Date(invoice.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-xs font-black text-gray-900 tracking-tight">{formatCurrency(invoice.total)}</div>
                        {invoice.paidAmount > 0 && (
                          <div className="text-[9px] text-emerald-600 font-black uppercase tracking-tighter">Liquidated: {formatCurrency(invoice.paidAmount)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`ent-badge font-bold uppercase ${statusStyles[invoice.status]?.bg} ${statusStyles[invoice.status]?.text} border-gray-100`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-all"
                            title="Analytics View"
                          >
                            <Eye size={14} />
                          </Link>
                          {invoice.status === 'draft' && (
                            <Link
                              href={`/invoices/${invoice.id}/edit`}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-gray-50 rounded-md transition-all"
                              title="Edit Invoice"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-pencil"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </Link>
                          )}
                          {invoice.status === 'draft' ? (
                            <button
                              onClick={() => setDeleteId(invoice.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-50 rounded-md transition-all"
                              title="Delete Invoice (Draft)"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-trash-2"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" x2="10" y1="11" y2="17" />
                                <line x1="14" x2="14" y1="11" y2="17" />
                              </svg>
                            </button>
                          ) : invoice.status !== 'cancelled' ? (
                            <button
                              onClick={() => setCancelId(invoice.id)}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all"
                              title="Cancel Invoice (GST Compliance)"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-ban"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <path d="m4.9 4.9 14.2 14.2" />
                              </svg>
                            </button>
                          ) : null}
                          <button
                            onClick={async () => {
                              try {
                                toast.info('Exporting unit...');
                                const blob = await invoicesApi.generatePDF(invoice.id);
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${invoice.invoiceNumber}.pdf`;
                                a.click();
                                toast.success('Transfer complete');
                              } catch (e) { toast.error('Transfer failed'); }
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-all"
                            title="Generate PDF"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Override System */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-auto bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-md shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 z-50 border border-white/10">
          <div className="flex items-center gap-2 pl-2 pr-4 border-r border-white/10">
            <div className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center font-black text-xs">
              {selectedIds.length}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Units Locked</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  await invoicesApi.batchSend(selectedIds);
                  toast.success('Transmission sequence initiated');
                  loadInvoices();
                } catch (e) { toast.error('Sequence failed'); }
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-primary-600 rounded text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5"
            >
              <Mail size={14} /> Dispatch
            </button>

            <CustomSelect
              options={[
                { label: 'Status Override', value: '' },
                { label: 'Liquidated', value: 'paid' },
                { label: 'Transmitted', value: 'sent' },
                { label: 'Defaulted', value: 'overdue' }
              ]}
              value=""
              onChange={async (val) => {
                if (!val) return;
                try {
                  setLoading(true);
                  await invoicesApi.batchUpdateStatus(selectedIds, val);
                  toast.success('Registry updated');
                  loadInvoices();
                } catch (e) { toast.error('Update failed'); }
              }}
              className="min-w-[140px]"
            />
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className="text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest px-2"
          >
            Clear
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />

      <ConfirmDialog
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="Cancel Invoice"
        message="This will mark the invoice as cancelled for GST compliance. The invoice number will be permanently reserved and cannot be reused. Continue?"
        type="warning"
        confirmText="Cancel Invoice"
        cancelText="Go Back"
      />
    </div>
  );
}
