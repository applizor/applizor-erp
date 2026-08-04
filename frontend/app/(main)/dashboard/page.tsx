'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Clock,
  ChevronRight,
  Activity,
  Zap,
  Calendar,
  Briefcase,
} from 'lucide-react';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import AdminEnterpriseDashboard from '@/components/dashboard/AdminEnterpriseDashboard';

export default function DashboardPage() {
  const { can, user } = usePermission();
  const [loading, setLoading] = useState(true);

  const isStudent = user?.roles?.some((r: string) => r.toLowerCase() === 'student');
  // Admin view requires ability to read accounting data
  const isAdminView = can('Accounting', 'read');

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="animate-fade-in pb-20 px-2 lg:px-4">
      {isStudent ? <StudentDashboard /> : isAdminView ? <AdminEnterpriseDashboard /> : <EmployeeDashboard />}
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
        api.get('/attendance-leave/my-balances').catch(() => ({ data: [] })),
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
            <div className="md:col-span-2 ent-card p-6 bg-white shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Project Distribution</h3>
                <Activity size={16} className="text-slate-300" />
              </div>
              <div className="h-48 w-full">
                {(taskAnalysis?.projectData || []).length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">No project data</div>
                ) : (
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
                )}
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

            <div className="md:col-span-2 ent-card p-6 bg-white shadow-md">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Task Status Mix</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: taskAnalysis?.stats?.completed || 0, color: '#059669' },
                        { name: 'In Progress', value: taskAnalysis?.stats?.inProgress || 0, color: '#d97706' },
                        { name: 'Overdue', value: taskAnalysis?.stats?.overdue || 0, color: '#e11d48' },
                        { name: 'Other', value: Math.max(0, (taskAnalysis?.stats?.total || 0) - (taskAnalysis?.stats?.completed || 0) - (taskAnalysis?.stats?.inProgress || 0) - (taskAnalysis?.stats?.overdue || 0)), color: '#64748b' },
                      ].filter((d) => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {[
                        { name: 'Completed', value: taskAnalysis?.stats?.completed || 0, color: '#059669' },
                        { name: 'In Progress', value: taskAnalysis?.stats?.inProgress || 0, color: '#d97706' },
                        { name: 'Overdue', value: taskAnalysis?.stats?.overdue || 0, color: '#e11d48' },
                        { name: 'Other', value: Math.max(0, (taskAnalysis?.stats?.total || 0) - (taskAnalysis?.stats?.completed || 0) - (taskAnalysis?.stats?.inProgress || 0) - (taskAnalysis?.stats?.overdue || 0)), color: '#64748b' },
                      ].filter((d) => d.value > 0).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
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

