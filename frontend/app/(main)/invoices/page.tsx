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
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 text-${colorClass.split('-')[1]}-600 shadow-sm transition-transform group-hover:scale-105`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Dynamic Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 leading-none">
            <Receipt className="w-5 h-5 text-primary-600" />
            Commercial Ledger
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">Operational view of revenue generation and collections</p>
        </div>
        <Link
          href="/invoices/create"
          className="flex items-center gap-2 bg-primary-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </Link>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderStatCard('Pending Drafts', stats?.byStatus?.find((s: any) => s.status === 'draft')?._count || 0, <Clock size={16} />, 'bg-slate-500', 'Work in progress')}
        {renderStatCard('Receivables', formatCurrency(stats?.byStatus?.filter((s: any) => s.status !== 'paid').reduce((acc: any, s: any) => acc + Number(s._sum.total), 0) || 0), <TrendingUp size={16} />, 'bg-primary-500', 'Awaiting clearance')}
        {renderStatCard('Defaulted', formatCurrency(stats?.overdueAmount || 0), <AlertCircle size={16} />, 'bg-rose-500', `${stats?.overdueCount || 0} Critical units`)}
        {renderStatCard('Liquidity', formatCurrency(stats?.byStatus?.reduce((acc: any, s: any) => acc + Number(s._sum.paidAmount || 0), 0) || 0), <DollarSign size={16} />, 'bg-emerald-500', 'Realised revenue')}
      </div>

      {/* Operations Toolbar */}
      <div className="ent-card p-3 flex flex-col lg:flex-row items-center gap-3 bg-gray-50/50">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search documents, entities or financial markers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded text-xs font-bold focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="flex-1 lg:flex-none py-2 px-3 border border-gray-200 bg-white rounded text-[10px] font-black text-gray-600 uppercase tracking-widest cursor-pointer outline-none focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            {Object.keys(statusStyles).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
          <select
            value={filters.clientId}
            onChange={e => setFilters({ ...filters, clientId: e.target.value })}
            className="flex-1 lg:flex-none py-2 px-3 border border-gray-200 bg-white rounded text-[10px] font-black text-gray-600 uppercase tracking-widest cursor-pointer outline-none focus:border-primary-500"
          >
            <option value="">All Consumers</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="p-2 bg-white border border-gray-200 rounded hover:bg-gray-100 text-gray-400">
            <Filter size={14} />
          </button>
        </div>
      </div>

      {/* Data Visualization Grid */}
      <div className="ent-card overflow-hidden">
        {loading && invoices.length === 0 ? (
          <InvoiceListSkeleton />
        ) : invoices.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="text-gray-200" />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">No Documents Found</h3>
            <p className="text-xs text-gray-400 font-medium mt-1">Adjustment of filters may yield results</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
              <tbody className="divide-y divide-gray-50">
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
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded bg-gray-100 flex items-center justify-center font-black text-[10px] ${invoice.type === 'quotation' ? 'text-amber-600' : 'text-primary-600'}`}>
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
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded transition-all"
                            title="Analytics View"
                          >
                            <Eye size={14} />
                          </Link>
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
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded transition-all"
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
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-auto bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 z-50 border border-white/10">
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

            <select
              onChange={async (e) => {
                try {
                  setLoading(true);
                  await invoicesApi.batchUpdateStatus(selectedIds, e.target.value);
                  toast.success('Registry updated');
                  loadInvoices();
                } catch (e) { toast.error('Update failed'); }
              }}
              className="bg-slate-800 border-white/5 rounded text-[10px] font-black uppercase tracking-widest py-2 px-3 focus:ring-0 outline-none cursor-pointer"
              value=""
            >
              <option value="" disabled>Status Override</option>
              <option value="paid" className="bg-slate-900">Liquidated</option>
              <option value="sent" className="bg-slate-900">Transmitted</option>
              <option value="overdue" className="bg-slate-900 text-rose-400">Defaulted</option>
            </select>
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className="text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest px-2"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
