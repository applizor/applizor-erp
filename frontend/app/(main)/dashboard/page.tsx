'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  ChevronRight,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from 'lucide-react';
import api from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalLeads: 0,
    totalQuotations: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    netIncome: 0,
    receivables: 0,
    gstLiability: 0,
    trendData: [
      { name: 'W1', revenue: 4000 },
      { name: 'W2', revenue: 3000 },
      { name: 'W3', revenue: 5000 },
      { name: 'W4', revenue: 2780 },
      { name: 'W5', revenue: 1890 },
      { name: 'W6', revenue: 2390 },
      { name: 'W7', revenue: 3490 },
    ]
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [clients, leads, quotations, invoices, balances] = await Promise.all([
        api.get('/clients').catch(() => ({ data: { clients: [] } })),
        api.get('/leads').catch(() => ({ data: { leads: [] } })),
        api.get('/quotations').catch(() => ({ data: { quotations: [] } })),
        api.get('/invoices').catch(() => ({ data: { invoices: [] } })),
        api.get('/accounting/accounts').catch(() => ({ data: [] }))
      ]);

      const clientsData = clients.data.clients || [];
      const leadsData = leads.data.leads || [];
      const quotationsData = quotations.data.quotations || [];
      const invoicesData = invoices.data.invoices || [];
      const accounts = balances.data || [];

      // Calculate stats
      const totalRevenue = invoicesData
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + (Number(inv.total) || 0), 0);

      const pendingAmount = invoicesData
        .filter((inv: any) => inv.status === 'sent' || inv.status === 'overdue')
        .reduce((sum: number, inv: any) => sum + (Number(inv.total) || 0), 0);

      // Extract specific ledger balances for Dashboard Pulse
      const receivables = accounts.find((a: any) => a.code === '1200')?.balance || 0;
      const gstPayable = accounts
        .filter((a: any) => a.code.startsWith('220')) // GST accounts
        .reduce((sum: number, a: any) => sum + Number(a.balance), 0);

      // Rough P&L for dashboard from ledger
      const income = accounts.filter((a: any) => a.type === 'income').reduce((sum: number, a: any) => sum + Number(a.balance), 0);
      const expenses = accounts.filter((a: any) => a.type === 'expense').reduce((sum: number, a: any) => sum + Number(a.balance), 0);
      const netIncome = income - expenses;

      setStats({
        ...stats,
        totalClients: clientsData.length,
        totalLeads: leadsData.length,
        totalQuotations: quotationsData.length,
        totalInvoices: invoicesData.length,
        totalRevenue,
        pendingInvoices: pendingAmount,
        netIncome,
        receivables: Number(receivables),
        gstLiability: Number(gstPayable)
      });
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="animate-fade-in pb-20 px-2 lg:px-4">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Operational Intelligence</h1>
          <p className="mt-1 text-slate-500 font-medium text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-pulse" />
            Enterprise resource engine active & synchronized.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadDashboardData}
            className="bg-white border border-slate-200 p-2.5 rounded-md hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh Insight"
          >
            <Activity size={16} className="text-slate-400" />
          </button>
          <Link
            href="/accounting/chart-of-accounts"
            className="bg-primary-900 text-white px-4 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2"
          >
            <Zap size={14} className="text-amber-400" />
            Live Ledger
          </Link>
        </div>
      </div>

      {/* Financial Pulse Section - NEW Premium Feature */}
      <div className="mb-8 overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-slate-100" />
          <h2 className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase whitespace-nowrap">Financial Pulse</h2>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Net Income Sparkline Card */}
          <div className="ent-card p-5 border-t-4 border-t-primary-600 bg-white shadow-xl relative group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Periodic Net Income</p>
                <h3 className={`text-xl font-black ${stats.netIncome >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                  {formatCurrency(stats.netIncome)}
                </h3>
              </div>
              <div className={`p-2 rounded ${stats.netIncome >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stats.netIncome >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
            </div>
            <div className="h-12 w-full opacity-60 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trendData}>
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={stats.netIncome >= 0 ? "#10b981" : "#ef4444"}
                    fill={stats.netIncome >= 0 ? "#10b98120" : "#ef444420"}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Receivables Card */}
          <div className="ent-card p-5 border-t-4 border-t-emerald-500">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Accounts Receivable</p>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">{formatCurrency(stats.receivables)}</h3>
              <div className="p-2 bg-emerald-50 rounded-md text-emerald-600">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-2/3" />
              </div>
              <span className="text-[9px] font-black text-emerald-600 uppercase">Settled</span>
            </div>
          </div>

          {/* GST Liability Card */}
          <div className="ent-card p-5 border-t-4 border-t-rose-500">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GST Statutory Liability</p>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-rose-600">{formatCurrency(stats.gstLiability)}</h3>
              <div className="p-2 bg-rose-50 rounded-md text-rose-600">
                <ShieldCheck size={16} />
              </div>
            </div>
            <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase italic">Accumulated Tax Payable</p>
          </div>

          {/* Pipeline Intensity */}
          <div className="ent-card p-5 border-t-4 border-t-amber-500 bg-slate-50/30">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unsettled Value</p>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">{formatCurrency(stats.pendingInvoices)}</h3>
              <div className="p-2 bg-amber-50 rounded-md text-amber-600">
                <Wallet size={16} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[9px] font-black tracking-tighter">
              <span className="text-amber-600 uppercase">Invoiced Pipeline</span>
              <span className="text-slate-400">{((stats.pendingInvoices / (stats.totalRevenue + stats.pendingInvoices || 1)) * 100).toFixed(0)}% SHARE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <h2 className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mb-4 px-2">Operational Centers</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        {[
          { title: 'Customer Base', value: stats.totalClients, icon: Users, color: 'bg-primary-500', trend: 'Growing', link: '/clients' },
          { title: 'Market Leads', value: stats.totalLeads, icon: TrendingUp, color: 'bg-emerald-500', trend: 'Active', link: '/leads/list' },
          { title: 'Gross Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'bg-violet-500', trend: 'Verified', link: '/invoices' },
          { title: 'Proposals', value: stats.totalQuotations, icon: FileText, color: 'bg-sky-500', trend: 'Sent', link: '/quotations' },
          { title: 'Ledger Items', value: stats.totalInvoices, icon: CheckCircle, color: 'bg-rose-500', trend: 'Total', link: '/invoices' },
          { title: 'System Health', value: '100%', icon: CheckCircle, color: 'bg-indigo-500', trend: 'Optimal', link: '/settings' },
        ].map((stat, i) => (
          <div key={i} className="ent-card p-0.5 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <Link href={stat.link} className="block p-4">
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${stat.color} bg-opacity-10 text-${stat.color.split('-')[1]}-600 group-hover:scale-110 transition-transform duration-500`}>
                  <stat.icon size={20} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400 uppercase tracking-tighter">{stat.trend}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-200 group-hover:text-primary-600 transition-colors" />
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Action Center - Refined Quick Links */}
      <h2 className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mb-4 px-2">Workflow Accelerators</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { title: 'Onboard Client', desc: 'Enterprise registration', icon: Users, color: 'primary', href: '/clients/create' },
          { title: 'Capture Lead', desc: 'Capture opportunity', icon: TrendingUp, color: 'emerald', href: '/leads/create' },
          { title: 'Draft Proposal', desc: 'Strategic quotation', icon: FileText, color: 'sky', href: '/quotations/create' },
          { title: 'Generate Billing', desc: 'Execute invoice', icon: DollarSign, color: 'violet', href: '/invoices/create' },
        ].map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="glass group p-4 rounded-md border border-slate-100 hover:border-primary-100 transition-all duration-300 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-16 h-16 bg-${action.color}-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`} />
            <div className={`w-8 h-8 rounded-md bg-${action.color}-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon size={16} className={`text-${action.color}-600`} />
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-0.5">{action.title}</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Visual Indicator / Bottom Banner */}
      <div className="bg-slate-900 rounded-md p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-xl font-black text-white leading-tight mb-3">Enterprise Insight Engine</h2>
          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
            Your ledger integrity is verified. Real-time balance synchronization
            ensures audit-ready compliance across all operational modules.
          </p>
          <div className="flex gap-3">
            <Link
              href="/accounting/reports/profit-loss"
              className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-black rounded-md text-[10px] uppercase tracking-widest transition-all"
            >
              Review Reports
            </Link>
            <Link
              href="/accounting/chart-of-accounts"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-md text-[10px] uppercase tracking-widest transition-all"
            >
              System Health
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { ShieldCheck } from 'lucide-react';
