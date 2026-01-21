'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Plus, Eye, Download, Mail, Filter,
  TrendingUp, Clock, AlertCircle, CheckCircle2,
  MoreVertical, Calendar, ChevronRight
} from 'lucide-react';
import { invoicesApi } from '@/lib/api/invoices';
import { clientsApi } from '@/lib/api/clients';
import { useToast } from '@/hooks/useToast';
import { useCurrency } from '@/context/CurrencyContext';
import { InvoiceListSkeleton } from '@/components/invoices/InvoiceListSkeleton';

export default function InvoicesPage() {
  const toast = useToast();
  const { formatCurrency } = useCurrency();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', clientId: '' });

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
  }, [search, filters]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoicesApi.getAll({
        ...filters,
        search
      } as any);
      setInvoices(data.invoices || []);
      setSelectedIds([]); // Reset selection on reload
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(invoices.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchUpdateStatus = async (status: string) => {
    try {
      setLoading(true);
      await invoicesApi.batchUpdateStatus(selectedIds, status);
      toast.success(`Successfully updated ${selectedIds.length} invoices`);
      loadInvoices();
    } catch (error) {
      toast.error('Batch update failed');
    }
  };

  const handleBatchSend = async () => {
    try {
      setLoading(true);
      await invoicesApi.batchSend(selectedIds);
      toast.success(`Initiated sending for ${selectedIds.length} invoices`);
      loadInvoices();
    } catch (error) {
      toast.error('Batch send failed');
    }
  };

  const statusStyles: Record<string, { bg: string, text: string, icon: any }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
    sent: { bg: 'bg-blue-100', text: 'text-blue-700', icon: TrendingUp },
    paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
    partial: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    overdue: { bg: 'bg-rose-100', text: 'text-rose-700', icon: AlertCircle },
  };

  const renderStatCard = (title: string, value: string | number, icon: any, color: string, subValue?: string) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {subValue && <p className="text-xs text-gray-400 mt-1 font-medium">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <span className="text-primary-600 font-bold text-xs uppercase tracking-widest mb-2 block">Finances</span>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Billing & Invoices</h1>
            <p className="mt-2 text-gray-500 max-w-lg">
              Manage your accounts receivable, track client payments, and generate professional documents.
            </p>
          </div>
          <Link
            href="/invoices/create"
            className="inline-flex items-center px-6 py-3 rounded-xl shadow-lg shadow-primary-200 bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm"
          >
            <Plus size={20} className="mr-2" />
            Create Invoice
          </Link>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {renderStatCard('Drafts', stats?.byStatus?.find((s: any) => s.status === 'draft')?._count || 0, <Calendar size={20} />, 'bg-gray-500', 'Work in progress')}
          {renderStatCard('Outstanding', formatCurrency(stats?.byStatus?.filter((s: any) => s.status !== 'paid').reduce((acc: any, s: any) => acc + Number(s._sum.total), 0) || 0), <TrendingUp size={20} />, 'bg-blue-500', 'Total to be collected')}
          {renderStatCard('Overdue', formatCurrency(stats?.overdueAmount || 0), <AlertCircle size={20} />, 'bg-rose-500', `${stats?.overdueCount || 0} overdue invoices`)}
          {renderStatCard('Collected', formatCurrency(stats?.byStatus?.reduce((acc: any, s: any) => acc + Number(s._sum.paidAmount || 0), 0) || 0), <CheckCircle2 size={20} />, 'bg-emerald-500', 'Current period earnings')}
        </div>

        {/* Filters/Actions Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Quick search by invoice number or client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              className="flex-1 lg:flex-none py-3 px-4 rounded-xl border-gray-100 bg-white text-sm focus:ring-primary-500 font-medium text-gray-600"
            >
              <option value="">All Status</option>
              {Object.keys(statusStyles).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select
              value={filters.clientId}
              onChange={e => setFilters({ ...filters, clientId: e.target.value })}
              className="flex-1 lg:flex-none py-3 px-4 rounded-xl border-gray-100 bg-white text-sm focus:ring-primary-500 font-medium text-gray-600"
            >
              <option value="">All Clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Table Section */}
        {loading && invoices.length === 0 ? (
          <InvoiceListSkeleton />
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-20 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <Filter size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No invoices found</h3>
            <p className="text-gray-500 text-sm max-w-xs mt-1">Try adjusting your filters or search terms to find what you're looking for.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === invoices.length && invoices.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((invoice) => {
                    const StatusIcon = statusStyles[invoice.status]?.icon || Clock;
                    const isSelected = selectedIds.includes(invoice.id);
                    return (
                      <tr key={invoice.id} className={`hover:bg-gray-50/80 transition-all group ${isSelected ? 'bg-primary-50/30' : ''}`}>
                        <td className="px-6 py-5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(invoice.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${invoice.type === 'quotation' ? 'bg-amber-50 text-amber-600' : 'bg-primary-50 text-primary-600'}`}>
                              <Calendar size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                {invoice.invoiceNumber}
                              </p>
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">
                                {invoice.type}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-gray-900">{invoice.client?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{invoice.client?.email || 'No email'}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-600 font-medium">Issued: {new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                            <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
                          {invoice.paidAmount > 0 && (
                            <p className="text-[10px] text-emerald-600 font-bold">Paid: {formatCurrency(invoice.paidAmount)}</p>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight ${statusStyles[invoice.status]?.bg} ${statusStyles[invoice.status]?.text}`}>
                              <StatusIcon size={12} />
                              {invoice.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </Link>
                            <button
                              onClick={async () => {
                                try {
                                  const blob = await invoicesApi.generatePDF(invoice.id);
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
                                  a.click();
                                } catch (e) { toast.error('PDF fail'); }
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Download PDF"
                            >
                              <Download size={18} />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                            >
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-300 z-40 border border-gray-800">
          <div className="flex items-center gap-3 border-r border-gray-700 pr-6">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center font-bold text-sm">
              {selectedIds.length}
            </div>
            <span className="text-sm font-medium text-gray-300">Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchSend}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-bold transition-all flex items-center gap-2"
            >
              <Mail size={16} /> Send Email
            </button>
            <div className="h-6 w-px bg-gray-700 mx-1" />
            <select
              onChange={(e) => handleBatchUpdateStatus(e.target.value)}
              className="bg-gray-800 border-none rounded-lg text-sm font-bold focus:ring-0 py-2"
              value=""
            >
              <option value="" disabled>Update Status</option>
              <option value="paid">Mark as Paid</option>
              <option value="sent">Mark as Sent</option>
              <option value="overdue">Mark as Overdue</option>
              <option value="void">Void</option>
            </select>
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className="text-gray-400 hover:text-white transition-colors ml-4"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
