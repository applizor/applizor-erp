'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, FileText, DollarSign, TrendingUp, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

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
    recentClients: [],
    recentLeads: [],
    recentQuotations: [],
    recentInvoices: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [clients, leads, quotations, invoices] = await Promise.all([
        api.get('/clients').catch(() => ({ data: { clients: [] } })),
        api.get('/leads').catch(() => ({ data: { leads: [] } })),
        api.get('/quotations').catch(() => ({ data: { quotations: [] } })),
        api.get('/invoices').catch(() => ({ data: { invoices: [] } }))
      ]);

      const clientsData = clients.data.clients || [];
      const leadsData = leads.data.leads || [];
      const quotationsData = quotations.data.quotations || [];
      const invoicesData = invoices.data.invoices || [];

      // Calculate stats
      const totalRevenue = invoicesData
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

      const pendingAmount = invoicesData
        .filter((inv: any) => inv.status === 'sent' || inv.status === 'overdue')
        .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

      setStats({
        totalClients: clientsData.length,
        totalLeads: leadsData.length,
        totalQuotations: quotationsData.length,
        totalInvoices: invoicesData.length,
        totalRevenue,
        pendingInvoices: pendingAmount,
        recentClients: clientsData.slice(0, 5),
        recentLeads: leadsData.slice(0, 5),
        recentQuotations: quotationsData.slice(0, 5),
        recentInvoices: invoicesData.slice(0, 5)
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
    <div className="animate-fade-in pb-20">
      <div className="mb-6 px-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Operational Intelligence</h1>
        <p className="mt-1 text-slate-500 font-medium text-sm">
          Enterprise resource overview and performance analytics.
        </p>
      </div>

      {/* Stats Grid - Premium Layout */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {[
          { title: 'Customer Base', value: stats.totalClients, icon: Users, color: 'bg-indigo-500', trend: 'Growing', link: '/clients' },
          { title: 'Market Leads', value: stats.totalLeads, icon: TrendingUp, color: 'bg-emerald-500', trend: 'Active', link: '/leads/list' },
          { title: 'Settled Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'bg-violet-500', trend: 'Verified', link: '/invoices' },
          { title: 'Pipeline Value', value: formatCurrency(stats.pendingInvoices), icon: Clock, color: 'bg-amber-500', trend: 'Pending', link: '/invoices' },
          { title: 'Proposals', value: stats.totalQuotations, icon: FileText, color: 'bg-sky-500', trend: 'Sent', link: '/quotations' },
          { title: 'Ledger Items', value: stats.totalInvoices, icon: CheckCircle, color: 'bg-rose-500', trend: 'Total', link: '/invoices' },
        ].map((stat, i) => (
          <div key={i} className="ent-card p-0.5 relative overflow-hidden group">
            <Link href={stat.link} className="block p-4">
              <div className="flex items-center">
                <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10 text-${stat.color.split('-')[1]}-600 group-hover:scale-110 transition-transform duration-500`}>
                  <stat.icon size={20} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400 uppercase tracking-tighter">{stat.trend}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Action Center - Refined Quick Links */}
      <div className="mb-6 px-2">
        <h2 className="text-sm font-black text-slate-900 tracking-[0.15em] uppercase mb-4">Workflow Accelerators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Onboard Client', desc: 'Enterprise registration', icon: Users, color: 'indigo', href: '/clients/create' },
            { title: 'Capture Lead', desc: 'Capture opportunity', icon: TrendingUp, color: 'emerald', href: '/leads/create' },
            { title: 'Draft Proposal', desc: 'Strategic quotation', icon: FileText, color: 'sky', href: '/quotations/create' },
            { title: 'Generate Billing', desc: 'Execute invoice', icon: DollarSign, color: 'violet', href: '/invoices/create' },
          ].map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="glass group p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-16 h-16 bg-${action.color}-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`} />
              <div className={`w-8 h-8 rounded-lg bg-${action.color}-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon size={16} className={`text-${action.color}-600`} />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-0.5">{action.title}</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Visual Indicator / Bottom Banner */}
      <div className="mt-8 mx-2">
        <div className="bg-slate-900 rounded-[2rem] p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-xl font-black text-white leading-tight mb-3">Enterprise Insight Engine</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
              Your operational data is being synchronized in real-time. Advanced predictive analytics
              will be available in the next module update.
            </p>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all">
                Review Reports
              </button>
              <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all">
                System Health
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
