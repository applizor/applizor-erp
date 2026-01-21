'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import { attendanceApi, Attendance } from '@/lib/api/attendance';
import { auth } from '@/lib/auth';

import { MapPin, Search, Calendar, Clock, User, Filter, Activity, LogOut, ChevronRight, LayoutGrid } from 'lucide-react';

export default function AttendancePage() {
    const toast = useToast();
    const user = auth.getUser() as any;
    const isAdmin = user?.role === 'admin' || user?.role === 'hr_manager';
    const [activeTab, setActiveTab] = useState('my-attendance');

    const [todayStatus, setTodayStatus] = useState<any>(null);
    const [myHistory, setMyHistory] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);

    const [adminLogs, setAdminLogs] = useState<any[]>([]);
    const [filters, setFilters] = useState({ date: '', employeeName: '' });

    useEffect(() => {
        if (activeTab === 'my-attendance') {
            loadMyData();
        } else if (activeTab === 'admin-logs') {
            loadAdminData();
        }
    }, [activeTab]);

    const loadMyData = async () => {
        try {
            setLoading(true);
            const [status, history] = await Promise.all([
                attendanceApi.todayStatus(),
                attendanceApi.getMyAttendance()
            ]);
            setTodayStatus(status);
            setMyHistory(history);
        } catch (error) {
            console.error('Failed to load attendance:', error);
            toast.error('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    const loadAdminData = async () => {
        try {
            setLoading(true);
            const logs = await attendanceApi.getAll(filters);
            setAdminLogs(logs);
        } catch (error) {
            console.error('Failed to load logs:', error);
            toast.error('Audit sync failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        setGeoLoading(true);
        if (!navigator.geolocation) {
            toast.info('Geolocation protocol not supported');
            setGeoLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                await attendanceApi.checkIn({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                toast.success('Check-in sequence successful');
                loadMyData();
            } catch (error: any) {
                toast.error(error.response?.data?.error || 'Check-in failed');
            } finally {
                setGeoLoading(false);
            }
        }, (error) => {
            console.error('Geo Error:', error);
            toast.info('Location access required for verification');
            setGeoLoading(false);
        });
    };

    const handleCheckOut = async () => {
        try {
            await attendanceApi.checkOut();
            toast.success('Check-out sequence successful');
            loadMyData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Check-out failed');
        }
    };

    const renderMyAttendance = () => (
        <div className="space-y-6">
            {/* Operational Status Card */}
            <div className="ent-card p-6 bg-gradient-to-br from-white to-gray-50 flex flex-col items-center justify-center border-primary-100 shadow-xl shadow-primary-900/5">
                <div className="text-center mb-6">
                    <div className="flex items-center gap-2 justify-center text-gray-400 mb-2">
                        <Calendar size={12} className="text-primary-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Current Registry Period</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
                    </h2>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-100 shadow-sm">
                        <Clock size={14} className="text-primary-600" />
                        <span className="text-sm font-black text-gray-900 tracking-tight">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {!todayStatus?.checkedIn ? (
                        <button
                            onClick={handleCheckIn}
                            disabled={geoLoading}
                            className="bg-primary-900 hover:bg-black text-white px-10 py-4 rounded font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-primary-900/40 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <MapPin size={18} />
                            {geoLoading ? 'SYNCHRONIZING LOCATION...' : 'Initiate Shift Check-In'}
                        </button>
                    ) : !todayStatus?.checkedOut ? (
                        <button
                            onClick={handleCheckOut}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-10 py-4 rounded font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-rose-900/30 flex items-center gap-3 transition-all active:scale-95"
                        >
                            <LogOut size={18} />
                            Terminate Shift Session
                        </button>
                    ) : (
                        <div className="px-8 py-4 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Shift Protocol Completed</span>
                        </div>
                    )}
                </div>

                {todayStatus?.checkedIn && (
                    <div className="mt-6 flex items-center gap-4 text-[10px] font-bold text-gray-500 bg-gray-100/50 px-4 py-2 rounded">
                        <span className="flex items-center gap-1.5"><Activity size={12} className="text-emerald-500" /> SESSION ACTIVE</span>
                        <span className="w-px h-3 bg-gray-300" />
                        <span>INITIALIZED AT: {new Date(todayStatus.checkInTime).toLocaleTimeString()}</span>
                    </div>
                )}
            </div>

            {/* Individual Ledger */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity size={12} /> Personal Activity Registry
                    </h3>
                </div>

                <div className="ent-card overflow-hidden">
                    <table className="ent-table">
                        <thead>
                            <tr>
                                <th>Registry Date</th>
                                <th>Session Range</th>
                                <th>Total Duration</th>
                                <th>Protocol Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myHistory.map((record) => (
                                <tr key={record.id}>
                                    <td className="font-black text-gray-900 uppercase">{new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                    <td>
                                        <div className="flex items-center gap-2 font-bold text-gray-600 text-[10px]">
                                            <span className="px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</span>
                                            <ChevronRight size={10} className="text-gray-300" />
                                            <span className="px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'RUNNING'}</span>
                                        </div>
                                    </td>
                                    <td className="font-black text-[10px] text-gray-500 italic">SYSTEM CALCULATED</td>
                                    <td>
                                        <span className={`ent-badge ${record.status === 'present' ? 'ent-badge-success' :
                                                record.status === 'late' ? 'ent-badge-warning' : 'ent-badge-danger'
                                            }`}>
                                            {record.status?.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {myHistory.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        No registry records found for the current period
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderAdminLogs = () => (
        <div className="space-y-4">
            {/* Global Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="ent-form-group mb-0">
                    <label className="text-[9px] font-black text-gray-500 mb-1 uppercase tracking-widest">Registry Date</label>
                    <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="ent-input w-full py-2 px-3 text-[10px] font-black" />
                </div>
                <div className="ent-form-group mb-0">
                    <label className="text-[9px] font-black text-gray-500 mb-1 uppercase tracking-widest">Resource Name</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input type="text" placeholder="SEARCH RESOURCE..." value={filters.employeeName} onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })} className="ent-input w-full py-2 pl-9 pr-3 text-[10px] font-black uppercase tracking-widest" />
                    </div>
                </div>
                <button
                    onClick={loadAdminData}
                    className="flex items-center justify-center gap-2 bg-primary-900 text-white px-4 py-2.5 rounded font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                >
                    <Activity size={14} /> Global Sync
                </button>
            </div>

            {/* Global Audit Ledger */}
            <div className="ent-card overflow-hidden">
                <table className="ent-table">
                    <thead>
                        <tr>
                            <th>Resource</th>
                            <th>Registry Date</th>
                            <th>Check-In Protocol</th>
                            <th>Check-Out Protocol</th>
                            <th>Compliance Status</th>
                            <th>Operational Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        {adminLogs.map((log: any) => (
                            <tr key={log.id}>
                                <td className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center font-black text-[10px] text-gray-600 border border-gray-200 uppercase">
                                        {log.employee?.firstName?.[0]}{log.employee?.lastName?.[0]}
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-black text-gray-900 uppercase leading-none">{log.employee?.firstName} {log.employee?.lastName}</div>
                                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{log.employee?.department?.name || 'GENERIC'}</div>
                                    </div>
                                </td>
                                <td className="font-black text-gray-600 uppercase text-[10px]">{new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td className="font-bold text-gray-600 text-[10px]">{log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</td>
                                <td className="font-bold text-gray-600 text-[10px]">{log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</td>
                                <td>
                                    <span className={`ent-badge ${log.status === 'present' ? 'ent-badge-success' :
                                            log.status === 'late' ? 'ent-badge-warning' : 'ent-badge-danger'
                                        }`}>
                                        {log.status?.toUpperCase()}
                                    </span>
                                </td>
                                <td className="text-[10px] font-bold text-gray-400 italic">
                                    {log.notes || 'NO NOTES LOGGED'}
                                </td>
                            </tr>
                        ))}
                        {adminLogs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-20 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">
                                    No global activity logs detected for the specified criteria
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Semantic Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-lg border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-900 rounded-lg shadow-lg">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Attendance Matrix</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            Global Workforce Chronology Protocol <ChevronRight size={10} className="text-primary-600" /> {activeTab.replace('-', ' ').toUpperCase()}
                        </p>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button
                        onClick={() => setActiveTab('my-attendance')}
                        className={`flex items-center gap-2 py-2 px-4 rounded font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'my-attendance' ? 'bg-white text-primary-900 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <User size={14} /> Registry Status
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('admin-logs')}
                            className={`flex items-center gap-2 py-2 px-4 rounded font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'admin-logs' ? 'bg-white text-primary-900 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <LayoutGrid size={14} /> System Audit
                        </button>
                    )}
                </div>
            </div>

            {loading && !geoLoading && (
                <div className="py-20 flex flex-col items-center justify-center bg-white/50 rounded-lg border border-dashed border-gray-200 animate-pulse">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronizing Registry Intelligence...</p>
                </div>
            )}

            {!loading && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {activeTab === 'my-attendance' ? renderMyAttendance() : renderAdminLogs()}
                </div>
            )}
        </div>
    );
}
