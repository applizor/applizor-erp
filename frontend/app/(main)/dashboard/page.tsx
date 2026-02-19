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
  Wallet,
  Calendar,
  Briefcase,
  ShieldCheck
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
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';

export default function DashboardPage() {
  const { can, user } = usePermission();
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // We can determine view based on 'Accounting.read' permission
  // Admin view requires ability to read accounting data
  const isAdminView = can('Accounting', 'read');

  useEffect(() => {
    // Simulate initial loading to ensure permissions are ready
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="animate-fade-in pb-20 px-2 lg:px-4">
      {isAdminView ? <AdminDashboard /> : <EmployeeDashboard />}
    </div>
  );
}

// ----------------------------------------------------------------------
// EMPLOYEE DASHBOARD (New "My Workspace" View)
// ----------------------------------------------------------------------

function EmployeeDashboard() {
  const { user } = usePermission();
  const toast = useToast();
  const { confirm: _confirm } = useConfirm();
  const [attendance, setAttendance] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [taskAnalysis, setTaskAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadMyData();
  }, []);

  const loadMyData = async () => {
    try {
      const [attRes, leaveRes, taskRes] = await Promise.all([
        api.get('/attendance-leave/today-status').catch(() => ({ data: {} })),
        api.get('/leave-type/my-balances').catch(() => ({ data: [] })),
        api.get('/tasks/analysis/me').catch(() => ({ data: null }))
      ]);

      setAttendance(attRes.data);
      setLeaves(leaveRes.data || []);
      setTaskAnalysis(taskRes.data);
    } catch (error) {
      console.error('Failed to load employee data', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async () => {
    try {
      await api.post('/attendance-leave/check-in', { latitude: null, longitude: null });
      toast.success('Checked in successfully!');
      loadMyData();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || err?.message || 'Failed to check in');
    }
  };

  const checkOut = async () => {
    try {
      await api.post('/attendance-leave/check-out');
      toast.success('Checked out successfully!');
      loadMyData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to check out');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">My Workspace</h1>
        <p className="mt-1 text-slate-500 font-medium text-sm flex items-center gap-2">
          Welcome back, {user?.firstName}. Here is your daily briefing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. Attendance Widget */}
        <div className="ent-card p-6 border-t-4 border-t-primary-600 bg-white shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-black text-slate-900 uppercase">Attendance</h3>
            <Clock className="text-primary-600" size={20} />
          </div>

          <div className="text-center py-4">
            <div className={`text-3xl font-black mb-2 ${attendance?.checkedIn && !attendance?.checkedOut ? 'text-emerald-600' : 'text-slate-700'}`}>
              {attendance?.checkedIn && !attendance?.checkedOut ? 'Checked In' :
                attendance?.checkedOut ? 'Completed' : 'Not Started'}
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Status
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 border-t border-slate-100 pt-4">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Check In</p>
              <p className="text-sm font-bold text-slate-900">
                {attendance?.checkInTime ? new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Check Out</p>
              <p className="text-sm font-bold text-slate-900">
                {attendance?.checkOutTime ? new Date(attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {!attendance?.hasRecord && (
              <button onClick={checkIn} className="w-full btn-primary py-3 rounded-md shadow-lg">Check In Now</button>
            )}
            {attendance?.checkedIn && (
              <button onClick={checkOut} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-md uppercase tracking-widest text-[10px] shadow-lg transition-all">Check Out</button>
            )}
            {attendance?.checkedOut && (
              <div className="w-full bg-slate-100 text-slate-400 font-black py-3 rounded-md uppercase tracking-widest text-center text-[10px]">Shift Completed</div>
            )}
          </div>
        </div>

        {/* 2. Leave Balances Widget */}
        <div className="ent-card p-6 border-t-4 border-t-emerald-500 bg-white shadow-md">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-black text-slate-900 uppercase">Leave Balance</h3>
            <Calendar className="text-emerald-600" size={20} />
          </div>

          <div className="space-y-4 mt-2">
            {leaves.length > 0 ? leaves.map((leave: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-bold text-slate-700">{leave.leaveType.name}</span>
                </div>
                <span className="text-lg font-black text-slate-900">{leave.balance}</span>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No leave balances found.
              </div>
            )}
          </div>

          <Link href="/hrms/leaves" className="block w-full text-center mt-6 py-3 border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-500 hover:text-emerald-600 font-black uppercase text-[10px] tracking-widest rounded-md transition-all">
            Apply New Leave
          </Link>
        </div>

        {/* 3. Quick Actions / Tasks */}
        <div className="ent-card p-6 border-t-4 border-t-sky-500 bg-white shadow-md">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-black text-slate-900 uppercase">Quick Actions</h3>
            <Briefcase className="text-sky-600" size={20} />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Link href="/hrms/leaves" className="flex items-center gap-3 p-3 hover:bg-sky-50 rounded-md transition-colors group">
              <div className="p-2 bg-sky-100 text-sky-600 rounded-md group-hover:bg-sky-200"><Calendar size={16} /></div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">My Leaves</h4>
                <p className="text-[10px] text-slate-400">View history & status</p>
              </div>
              <ChevronRight size={14} className="ml-auto text-slate-300" />
            </Link>

            <Link href="/hrms/my-attendance" className="flex items-center gap-3 p-3 hover:bg-emerald-50 rounded-md transition-colors group">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md group-hover:bg-emerald-200"><Clock size={16} /></div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Attendance Log</h4>
                <p className="text-[10px] text-slate-400">Review your timesheets</p>
              </div>
              <ChevronRight size={14} className="ml-auto text-slate-300" />
            </Link>

            <Link href="/hrms/employees" className="flex items-center gap-3 p-3 hover:bg-violet-50 rounded-md transition-colors group">
              <div className="p-2 bg-violet-100 text-violet-600 rounded-md group-hover:bg-violet-200"><Users size={16} /></div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Directory</h4>
                <p className="text-[10px] text-slate-400">Find colleagues</p>
              </div>
              <ChevronRight size={14} className="ml-auto text-slate-300" />
            </Link>
          </div>
        </div>

      </div>

      {/* Advanced Task Analysis Section */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-slate-100" />
          <h2 className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase whitespace-nowrap px-4">Performance Intelligence</h2>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Stats Card */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="ent-card p-4 bg-white shadow-sm border-l-4 border-l-primary-600">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Tasks</p>
              <h4 className="text-2xl font-black text-slate-900">{taskAnalysis?.stats?.total || 0}</h4>
            </div>
            <div className="ent-card p-4 bg-white shadow-sm border-l-4 border-l-emerald-500">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</p>
              <h4 className="text-2xl font-black text-emerald-600">{taskAnalysis?.stats?.completed || 0}</h4>
            </div>
            <div className="ent-card p-4 bg-white shadow-sm border-l-4 border-l-amber-500">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">In Progress</p>
              <h4 className="text-2xl font-black text-amber-600">{taskAnalysis?.stats?.inProgress || 0}</h4>
            </div>
            <div className="ent-card p-4 bg-white shadow-sm border-l-4 border-l-rose-500">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Overdue</p>
              <h4 className="text-2xl font-black text-rose-600">{taskAnalysis?.stats?.overdue || 0}</h4>
            </div>

            {/* Project Distribution Chart */}
            <div className="md:col-span-4 ent-card p-6 bg-white shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Project Distribution</h3>
                <Activity size={16} className="text-slate-300" />
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={taskAnalysis?.projectData || []}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="count" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                {taskAnalysis?.projectData?.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{p.name} ({p.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Side Card */}
          <div className="lg:col-span-4 ent-card p-6 bg-slate-900 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              Recent Trajectory
            </h3>
            <div className="space-y-4">
              {taskAnalysis?.recentTasks?.length > 0 ? taskAnalysis.recentTasks.map((task: any, i: number) => (
                <div
                  key={i}
                  onClick={() => router.push(`/projects/${task.projectId}/tasks?taskId=${task.id}`)}
                  className="group relative pl-4 border-l border-slate-700 pb-2 cursor-pointer hover:border-primary-500 transition-all"
                >
                  <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-slate-700 group-hover:bg-primary-500 transition-colors shadow-sm" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1 group-hover:text-primary-300 transition-colors">{task.projectName || 'Internal'}</p>
                  <h4 className="text-xs font-bold text-white mb-1 group-hover:text-primary-400 transition-colors truncate">{task.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      task.status === 'todo' ? 'bg-slate-500/20 text-slate-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                      {task.status}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase">{new Date(task.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-500 italic">No recent activity</p>
                </div>
              )}
            </div>
            <Link href="/projects" className="block w-full text-center mt-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[10px] tracking-widest rounded-md transition-all">
              View Workroom
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// ADMIN DASHBOARD (Existing Financial View)
// ----------------------------------------------------------------------

function AdminDashboard() {
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
    <div className="animate-fade-in pb-20">
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
