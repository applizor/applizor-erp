'use client';

import { useEffect, useState } from 'react';
import { accountingApi, downloadCsv } from '@/lib/api/accounting';
import { useCurrency } from '@/context/CurrencyContext';
import { useToast } from '@/hooks/useToast';
import { Clock, RefreshCw, Wallet, FileSpreadsheet } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '@/components/ui/PageHeader';

export default function AgingReportPage() {
  const { formatCurrency } = useCurrency();
  const toast = useToast();
  const [type, setType] = useState<'ar' | 'ap'>('ar');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await accountingApi.getAgingReport(type);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load aging report');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [type]);

  const chartData = ['0-30 days', '31-60 days', '61-90 days', '90+ days'].map((bucket) => ({
    bucket,
    amount: rows.reduce((sum, row) => {
      const b = (row.buckets || []).find((x: any) => x.bucket === bucket);
      return sum + Number(b?.total || 0);
    }, 0),
  }));

  const handleExportCsv = () => {
    try {
      const header = ['Account', 'Code', '0-30', '31-60', '61-90', '90+', 'Total'];
      const csvRows = rows.map((row) => {
        const buckets = row.buckets || [];
        const vals = ['0-30 days', '31-60 days', '61-90 days', '90+ days'].map((label) => {
          const b = buckets.find((x: any) => x.bucket === label);
          return Number(b?.total || 0);
        });
        const total = vals.reduce((a, b) => a + b, 0);
        return [row.account, row.code, ...vals, total];
      });
      downloadCsv(`${type}-aging-report.csv`, header, csvRows);
      toast.success('Aging report exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleExportServer = async () => {
    try {
      toast.info('Exporting aging report...');
      await accountingApi.downloadExport(
        'AGING',
        `${type}-aging-report.csv`,
        undefined,
        undefined,
        { format: 'csv', agingType: type }
      );
      toast.success('Aging report exported');
    } catch {
      handleExportCsv();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Receivables / Payables Aging"
        subtitle="Outstanding balances by age bucket"
        icon={Clock}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setType('ar')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest ${type === 'ar' ? 'bg-primary-600 text-white' : 'text-slate-500'}`}
              >
                AR
              </button>
              <button
                type="button"
                onClick={() => setType('ap')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest ${type === 'ap' ? 'bg-primary-600 text-white' : 'text-slate-500'}`}
              >
                AP
              </button>
            </div>
            <button type="button" onClick={load} className="btn-secondary p-2" title="Refresh">
              <RefreshCw size={14} />
            </button>
            <button type="button" onClick={handleExportServer} className="btn-secondary flex items-center gap-2">
              <FileSpreadsheet size={14} /> Export CSV
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {chartData.map((b) => (
          <div key={b.bucket} className="ent-card p-4 border-t-4 border-t-amber-500">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{b.bucket}</p>
            <p className="text-lg font-black text-slate-900 mt-1">{formatCurrency(b.amount)}</p>
          </div>
        ))}
      </div>

      <div className="ent-card p-5">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
          <Wallet size={14} className="text-amber-600" />
          Aging Distribution
        </h2>
        <div className="h-64 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip formatter={(v: any) => [formatCurrency(Number(v) || 0), 'Amount']} />
                <Bar dataKey="amount" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="ent-card overflow-hidden">
        <table className="ent-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Code</th>
              <th className="text-right">0–30</th>
              <th className="text-right">31–60</th>
              <th className="text-right">61–90</th>
              <th className="text-right">90+</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">No aging balances found</td></tr>
            ) : (
              rows.map((row) => {
                const vals = ['0-30 days', '31-60 days', '61-90 days', '90+ days'].map((label) => {
                  const b = (row.buckets || []).find((x: any) => x.bucket === label);
                  return Number(b?.total || 0);
                });
                const total = vals.reduce((a, b) => a + b, 0);
                return (
                  <tr key={`${row.code}-${row.account}`}>
                    <td className="font-bold text-slate-900">{row.account}</td>
                    <td className="text-slate-500 font-mono text-xs">{row.code}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="text-right font-bold">{formatCurrency(v)}</td>
                    ))}
                    <td className="text-right font-black text-slate-900">{formatCurrency(total)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
