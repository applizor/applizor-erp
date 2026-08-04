'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  ChevronRight,
  DollarSign,
  FileText,
  PieChart as PieIcon,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  AlertTriangle,
  Target,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

type Period = '6m' | '12m' | 'ytd';

const CHART = {
  primary: '#0b4d6e',
  primarySoft: '#3a8da1',
  emerald: '#059669',
  amber: '#d97706',
  rose: '#e11d48',
  sky: '#0284c8',
  slate: '#64748b',
  violet: '#6366f1',
};

const STATUS_COLORS: Record<string, string> = {
  paid: CHART.emerald,
  sent: CHART.sky,
  overdue: CHART.rose,
  partial: CHART.amber,
  draft: CHART.slate,
  cancelled: '#94a3b8',
  new: CHART.sky,
  contacted: CHART.primarySoft,
  qualified: CHART.primary,
  proposal: CHART.amber,
  negotiation: CHART.violet,
  won: CHART.emerald,
  lost: CHART.rose,
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en', { month: 'short', year: '2-digit' });
}

function startOfPeriod(period: Period) {
  const now = new Date();
  if (period === 'ytd') return new Date(now.getFullYear(), 0, 1);
  const months = period === '6m' ? 5 : 11;
  return new Date(now.getFullYear(), now.getMonth() - months, 1);
}

function buildMonthBuckets(period: Period) {
  const start = startOfPeriod(period);
  const now = new Date();
  const keys: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= now) {
    keys.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: 'none',
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 700,
  boxShadow: '0 12px 32px rgba(15,23,42,0.25)',
};

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  delta,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: any;
  tone?: 'primary' | 'emerald' | 'amber' | 'rose' | 'sky';
  delta?: number | null;
}) {
  const tones = {
    primary: 'border-t-primary-600 text-primary-600 bg-primary-50',
    emerald: 'border-t-emerald-500 text-emerald-600 bg-emerald-50',
    amber: 'border-t-amber-500 text-amber-600 bg-amber-50',
    rose: 'border-t-rose-500 text-rose-600 bg-rose-50',
    sky: 'border-t-sky-500 text-sky-600 bg-sky-50',
  };
  return (
    <div className={`ent-card p-4 border-t-4 ${tones[tone].split(' ')[0]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">{value}</h3>
          {hint && <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wide">{hint}</p>}
        </div>
        <div className={`p-2 rounded-lg shrink-0 ${tones[tone].split(' ').slice(1).join(' ')}`}>
          <Icon size={16} />
        </div>
      </div>
      {delta !== null && delta !== undefined && (
        <div className={`mt-3 flex items-center gap-1 text-[10px] font-black ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(delta).toFixed(1)}% vs prior period
        </div>
      )}
    </div>
  );
}

export default function AdminEnterpriseDashboard() {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('6m');
  const [raw, setRaw] = useState<{
    clients: any[];
    leads: any[];
    quotations: any[];
    invoices: any[];
    accounts: any[];
    invoiceStats: any;
    taskCounts: Record<string, number>;
    projects: any[];
  }>({
    clients: [],
    leads: [],
    quotations: [],
    invoices: [],
    accounts: [],
    invoiceStats: null,
    taskCounts: {},
    projects: [],
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [clients, leads, quotations, invoices, accounts, invoiceStats, taskCounts, projects] = await Promise.all([
        api.get('/clients?limit=500').catch(() => ({ data: { clients: [] } })),
        api.get('/leads?limit=500').catch(() => ({ data: { leads: [] } })),
        api.get('/quotations?limit=500').catch(() => ({ data: { quotations: [] } })),
        api.get('/invoices?limit=500').catch(() => ({ data: { invoices: [] } })),
        api.get('/accounting/accounts').catch(() => ({ data: [] })),
        api.get('/invoices/stats/summary').catch(() => ({ data: null })),
        api.get('/tasks/counts').catch(() => ({ data: {} })),
        api.get('/projects?limit=200').catch(() => ({ data: [] })),
      ]);

      setRaw({
        clients: clients.data.clients || clients.data || [],
        leads: leads.data.leads || leads.data || [],
        quotations: quotations.data.quotations || quotations.data || [],
        invoices: invoices.data.invoices || invoices.data || [],
        accounts: Array.isArray(accounts.data) ? accounts.data : accounts.data?.accounts || [],
        invoiceStats: invoiceStats.data,
        taskCounts: taskCounts.data || {},
        projects: Array.isArray(projects.data) ? projects.data : projects.data?.projects || [],
      });
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const analytics = useMemo(() => {
    const { clients, leads, quotations, invoices, accounts, invoiceStats, taskCounts, projects } = raw;
    const periodStart = startOfPeriod(period);
    const months = buildMonthBuckets(period);

    const inPeriod = (d?: string | Date | null) => {
      if (!d) return false;
      const dt = new Date(d);
      return dt >= periodStart;
    };

    const periodInvoices = invoices.filter((inv: any) => inPeriod(inv.issueDate || inv.createdAt));
    const paid = invoices.filter((inv: any) => inv.status === 'paid');
    const paidInPeriod = paid.filter((inv: any) => inPeriod(inv.paidAt || inv.updatedAt || inv.issueDate));

    const totalRevenue = paid.reduce((s: number, inv: any) => s + (Number(inv.total) || 0), 0);
    const periodRevenue = paidInPeriod.reduce((s: number, inv: any) => s + (Number(inv.total) || 0), 0);
    const outstanding = invoices
      .filter((inv: any) => ['sent', 'overdue', 'partial'].includes(inv.status))
      .reduce((s: number, inv: any) => s + Math.max(0, (Number(inv.total) || 0) - (Number(inv.paidAmount) || 0)), 0);

    const billedTotal = invoices
      .filter((inv: any) => inv.status !== 'cancelled' && inv.status !== 'draft')
      .reduce((s: number, inv: any) => s + (Number(inv.total) || 0), 0);
    const collectedTotal = invoices.reduce((s: number, inv: any) => s + (Number(inv.paidAmount) || 0), 0);
    const collectionRate = billedTotal > 0 ? (collectedTotal / billedTotal) * 100 : 0;

    const overdueInvoices = invoices.filter((inv: any) => {
      if (['paid', 'cancelled', 'draft'].includes(inv.status)) return false;
      if (inv.status === 'overdue') return true;
      return inv.dueDate && new Date(inv.dueDate) < new Date();
    });
    const overdueAmount = overdueInvoices.reduce(
      (s: number, inv: any) => s + Math.max(0, (Number(inv.total) || 0) - (Number(inv.paidAmount) || 0)),
      0
    );

    const receivables = Number(accounts.find((a: any) => a.code === '1200')?.balance || 0);
    const gstLiability = accounts
      .filter((a: any) => String(a.code || '').startsWith('220'))
      .reduce((s: number, a: any) => s + Number(a.balance || 0), 0);
    const income = accounts.filter((a: any) => a.type === 'income').reduce((s: number, a: any) => s + Number(a.balance || 0), 0);
    const expenses = accounts.filter((a: any) => a.type === 'expense').reduce((s: number, a: any) => s + Number(a.balance || 0), 0);
    const netIncome = income - expenses;

    // Prior period for deltas
    const spanMs = Date.now() - periodStart.getTime();
    const priorStart = new Date(periodStart.getTime() - spanMs);
    const priorPaid = paid.filter((inv: any) => {
      const d = new Date(inv.paidAt || inv.updatedAt || inv.issueDate);
      return d >= priorStart && d < periodStart;
    });
    const priorRevenue = priorPaid.reduce((s: number, inv: any) => s + (Number(inv.total) || 0), 0);
    const revenueDelta = priorRevenue > 0 ? ((periodRevenue - priorRevenue) / priorRevenue) * 100 : null;

    // Monthly revenue + collections
    const revenueTrend = months.map((key) => {
      const billed = periodInvoices
        .filter((inv: any) => monthKey(new Date(inv.issueDate || inv.createdAt)) === key && inv.status !== 'cancelled')
        .reduce((s: number, inv: any) => s + (Number(inv.total) || 0), 0);
      const collected = invoices
        .filter((inv: any) => {
          const d = inv.paidAt || (inv.status === 'paid' ? inv.updatedAt : null);
          return d && monthKey(new Date(d)) === key;
        })
        .reduce((s: number, inv: any) => s + (Number(inv.paidAmount) || Number(inv.total) || 0), 0);
      return { month: monthLabel(key), key, billed: Math.round(billed), collected: Math.round(collected) };
    });

    // Invoice status mix
    const statusMap: Record<string, { name: string; value: number; count: number }> = {};
    invoices.forEach((inv: any) => {
      const st = inv.status || 'unknown';
      if (!statusMap[st]) statusMap[st] = { name: st, value: 0, count: 0 };
      statusMap[st].value += Number(inv.total) || 0;
      statusMap[st].count += 1;
    });
    const invoiceStatus = Object.values(statusMap).sort((a, b) => b.value - a.value);

    // Lead pipeline
    const leadMap: Record<string, number> = {};
    leads.forEach((l: any) => {
      const st = (l.status || 'new').toLowerCase();
      leadMap[st] = (leadMap[st] || 0) + 1;
    });
    const leadPipeline = Object.entries(leadMap)
      .map(([name, count]) => ({ name, count, value: leads.filter((l: any) => (l.status || '').toLowerCase() === name).reduce((s: number, l: any) => s + (Number(l.value) || 0), 0) }))
      .sort((a, b) => b.count - a.count);

    const pipelineValue = leads.reduce((s: number, l: any) => s + (Number(l.value) || 0), 0);

    // Top clients
    const clientBill: Record<string, { name: string; billed: number; paid: number }> = {};
    invoices.forEach((inv: any) => {
      if (inv.status === 'cancelled' || inv.status === 'draft') return;
      const id = inv.clientId || inv.client?.id || 'unknown';
      const name = inv.client?.name || 'Unknown Client';
      if (!clientBill[id]) clientBill[id] = { name, billed: 0, paid: 0 };
      clientBill[id].billed += Number(inv.total) || 0;
      clientBill[id].paid += Number(inv.paidAmount) || (inv.status === 'paid' ? Number(inv.total) || 0 : 0);
    });
    const topClients = Object.values(clientBill)
      .sort((a, b) => b.billed - a.billed)
      .slice(0, 6);

    // Aging buckets
    const now = new Date();
    const aging = [
      { name: 'Current', amount: 0 },
      { name: '1–30d', amount: 0 },
      { name: '31–60d', amount: 0 },
      { name: '61–90d', amount: 0 },
      { name: '90d+', amount: 0 },
    ];
    invoices.forEach((inv: any) => {
      if (['paid', 'cancelled', 'draft'].includes(inv.status)) return;
      const due = inv.dueDate ? new Date(inv.dueDate) : null;
      const bal = Math.max(0, (Number(inv.total) || 0) - (Number(inv.paidAmount) || 0));
      if (!due || due >= now) {
        aging[0].amount += bal;
        return;
      }
      const days = Math.floor((now.getTime() - due.getTime()) / 86400000);
      if (days <= 30) aging[1].amount += bal;
      else if (days <= 60) aging[2].amount += bal;
      else if (days <= 90) aging[3].amount += bal;
      else aging[4].amount += bal;
    });
    aging.forEach((a) => { a.amount = Math.round(a.amount); });

    const taskTotal = Object.values(taskCounts).reduce((s, n) => s + (Number(n) || 0), 0);
    const activeProjects = projects.filter((p: any) => p.status === 'active' || !p.status).length;

    return {
      clients: clients.length,
      leads: leads.length,
      quotations: quotations.length,
      invoices: invoices.length,
      totalRevenue,
      periodRevenue,
      revenueDelta,
      outstanding,
      collectionRate,
      overdueCount: overdueInvoices.length || invoiceStats?.overdueCount || 0,
      overdueAmount,
      receivables,
      gstLiability,
      netIncome,
      pipelineValue,
      revenueTrend,
      invoiceStatus,
      leadPipeline,
      topClients,
      aging,
      taskTotal,
      taskCounts,
      activeProjects,
      periodInvoiceCount: periodInvoices.length,
    };
  }, [raw, period]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="animate-fade-in pb-20 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Command Center</h1>
          <p className="mt-1 text-slate-500 font-medium text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Cross-module intelligence · finance, CRM & delivery
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            {([
              ['6m', '6 Months'],
              ['12m', '12 Months'],
              ['ytd', 'YTD'],
            ] as [Period, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setPeriod(id)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors ${
                  period === id ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={loadDashboardData}
            className="bg-white border border-slate-200 p-2.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={14} className="text-slate-400" />
          </button>
          <Link
            href="/accounting/reports/profit-loss"
            className="bg-primary-900 text-white px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md flex items-center gap-2"
          >
            <Zap size={14} className="text-amber-400" />
            Full Reports
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Period Revenue" value={formatCurrency(analytics.periodRevenue)} icon={DollarSign} tone="primary" delta={analytics.revenueDelta} hint="Collected in range" />
        <KpiCard label="Collection Rate" value={`${analytics.collectionRate.toFixed(1)}%`} icon={Target} tone="emerald" hint="Paid / billed" />
        <KpiCard label="Outstanding AR" value={formatCurrency(analytics.outstanding)} icon={Wallet} tone="amber" hint="Open invoices" />
        <KpiCard label="Overdue Exposure" value={formatCurrency(analytics.overdueAmount)} icon={AlertTriangle} tone="rose" hint={`${analytics.overdueCount} invoices`} />
        <KpiCard label="Net Income" value={formatCurrency(analytics.netIncome)} icon={TrendingUp} tone={analytics.netIncome >= 0 ? 'emerald' : 'rose'} hint="Ledger P&L" />
        <KpiCard label="CRM Pipeline" value={formatCurrency(analytics.pipelineValue)} icon={Briefcase} tone="sky" hint={`${analytics.leads} leads`} />
      </div>

      {/* Primary charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 ent-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <BarChart3 size={14} className="text-primary-600" />
                Revenue vs Collections
              </h2>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Billed volume against cash collected by month</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {analytics.revenueTrend.every((r) => r.billed === 0 && r.collected === 0) ? (
              <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                No billing activity in this period
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.revenueTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="billedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                  formatter={(value: any, name: any) => [formatCurrency(Number(value) || 0), name === 'billed' ? 'Billed' : 'Collected']}
                />
                <Legend wrapperStyle={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }} />
                <Area type="monotone" dataKey="billed" name="billed" stroke={CHART.primary} fill="url(#billedFill)" strokeWidth={2} />
                <Bar dataKey="collected" name="collected" fill={CHART.emerald} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </ComposedChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="ent-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <PieIcon size={14} className="text-emerald-600" />
                Invoice Mix
              </h2>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Value by status</p>
            </div>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.invoiceStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {analytics.invoiceStatus.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || CHART.slate} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: any, _n: any, props: any) => [
                    `${formatCurrency(Number(value) || 0)} · ${props?.payload?.count || 0} inv`,
                    String(props?.payload?.name || '').toUpperCase(),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2 max-h-28 overflow-y-auto custom-scrollbar">
            {analytics.invoiceStatus.slice(0, 6).map((s) => (
              <div key={s.name} className="flex items-center justify-between text-[10px] font-bold">
                <span className="flex items-center gap-2 uppercase tracking-wide text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.name] || CHART.slate }} />
                  {s.name}
                </span>
                <span className="text-slate-900 font-black">{formatCurrency(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="ent-card p-5">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-1 flex items-center gap-2">
            <TrendingUp size={14} className="text-sky-600" />
            Lead Pipeline
          </h2>
          <p className="text-[10px] text-slate-400 font-bold mb-4">Stage distribution across CRM</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.leadPipeline} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={78} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800, textTransform: 'uppercase' as any }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: any, _n: any, props: any) => [
                    `${value} leads · ${formatCurrency(props?.payload?.value || 0)}`,
                    'Pipeline',
                  ]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {analytics.leadPipeline.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || CHART.primarySoft} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ent-card p-5">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-1 flex items-center gap-2">
            <Users size={14} className="text-primary-600" />
            Top Clients by Billing
          </h2>
          <p className="text-[10px] text-slate-400 font-bold mb-4">Highest invoiced accounts</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topClients} margin={{ top: 4, right: 4, left: 0, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Billed']} />
                <Bar dataKey="billed" fill={CHART.primary} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ent-card p-5">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-1 flex items-center gap-2">
            <Activity size={14} className="text-amber-600" />
            Receivables Aging
          </h2>
          <p className="text-[10px] text-slate-400 font-bold mb-4">Open balances by overdue bucket</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.aging} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="agingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.amber} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART.amber} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Balance']} />
                <Area type="monotone" dataKey="amount" stroke={CHART.amber} fill="url(#agingFill)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ops + compliance + actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-4 ent-card p-5">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Financial Pulse</h2>
          <div className="space-y-3">
            {[
              { label: 'Ledger Receivables', value: formatCurrency(analytics.receivables), icon: Wallet, tone: 'text-emerald-600 bg-emerald-50' },
              { label: 'GST Liability', value: formatCurrency(analytics.gstLiability), icon: ShieldCheck, tone: 'text-rose-600 bg-rose-50' },
              { label: 'Lifetime Revenue', value: formatCurrency(analytics.totalRevenue), icon: DollarSign, tone: 'text-primary-600 bg-primary-50' },
              { label: 'Period Invoices', value: String(analytics.periodInvoiceCount), icon: FileText, tone: 'text-sky-600 bg-sky-50' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${row.tone}`}>
                    <row.icon size={14} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{row.label}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-4 ent-card p-5">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Delivery & Ops</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Customers', value: analytics.clients, href: '/clients' },
              { label: 'Active Projects', value: analytics.activeProjects, href: '/projects' },
              { label: 'Open Tasks', value: analytics.taskTotal, href: '/tasks' },
              { label: 'Proposals', value: analytics.quotations, href: '/quotations' },
            ].map((m) => (
              <Link key={m.label} href={m.href} className="p-3 rounded-lg border border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{m.label}</p>
                <p className="text-xl font-black text-slate-900 mt-1">{m.value}</p>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(analytics.taskCounts).slice(0, 4).map(([status, count]) => (
              <span key={status} className="px-2 py-1 rounded-md bg-slate-100 text-[9px] font-black uppercase tracking-wider text-slate-600">
                {status}: {count as number}
              </span>
            ))}
          </div>
        </div>

        <div className="xl:col-span-4 ent-card p-5 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 relative z-10">Workflow Accelerators</h2>
          <div className="space-y-2 relative z-10">
            {[
              { title: 'Onboard Client', href: '/clients/create', icon: Users },
              { title: 'Capture Lead', href: '/leads/create', icon: TrendingUp },
              { title: 'Draft Proposal', href: '/quotations/create', icon: FileText },
              { title: 'Generate Invoice', href: '/invoices/create', icon: DollarSign },
              { title: 'P&L Report', href: '/accounting/reports/profit-loss', icon: BarChart3 },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="p-2 rounded-md bg-white/10 text-primary-200 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <a.icon size={14} />
                </div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-white flex-1">{a.title}</span>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
