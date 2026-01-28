'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { attendanceApi, holidaysApi, Holiday } from '@/lib/api/attendance';
import { Clock, LogIn, LogOut, MapPin, AlertTriangle, CheckCircle, Calendar, History, ArrowRight, Info } from 'lucide-react';

interface Attendance {
    id: string;
    date: string;
    checkIn: string;
    checkOut: string;
    status: string;
    ipAddress?: string;
    location?: string;
}

export default function MyAttendancePage() {
    const toast = useToast();
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [todayStatus, setTodayStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locError, setLocError] = useState<string | null>(null);
    const [todayHoliday, setTodayHoliday] = useState<any>(null);

    useEffect(() => {
        loadData();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => {
                    setLocError('Location access denied. Geo-fencing may fail.');
                }
            );
        } else {
            setLocError('Geolocation not supported.');
        }
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [historyData, statusData] = await Promise.all([
                attendanceApi.getMyAttendance(),
                attendanceApi.todayStatus()
            ]);
            setAttendance(historyData);
            setTodayStatus(statusData);

            const todayStr = new Date().toDateString();
            const holidays = await holidaysApi.getAll(new Date().getFullYear());
            const holiday = holidays.find((h: Holiday) => new Date(h.date).toDateString() === todayStr);
            setTodayHoliday(holiday || null);
        } catch (error) {
            console.error('Failed to load attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            setActionLoading(true);
            const payload: any = {};
            if (location) {
                payload.latitude = location.lat;
                payload.longitude = location.lng;
            }
            await attendanceApi.checkIn(payload);
            toast.success('Check-in successful');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Check-in failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        try {
            setActionLoading(true);
            await attendanceApi.checkOut();
            toast.success('Check-out successful');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Check-out failed');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Standardized Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Presence Tracking</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">Manage your daily check-in and check-out logs</p>
                    </div>
                </div>
                <Link href="/attendance/leaves" className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-md transition-colors group">
                    Leave Management <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {todayHoliday && (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-md flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center">
                        <Calendar size={16} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">Today is a Holiday</p>
                        <p className="text-xs font-bold text-emerald-600 italic mt-0.5">{todayHoliday.name}</p>
                    </div>
                </div>
            )}

            {locError && (
                <div className="p-2.5 bg-rose-50 rounded-md border border-rose-100 flex items-center gap-2 text-rose-600">
                    <AlertTriangle size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">{locError}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 ent-card p-5 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Today's Presence</h3>
                            <div className="text-lg font-bold text-gray-900">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                        {location && (
                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                <CheckCircle size={10} />
                                <span className="text-[8px] font-black uppercase tracking-widest">Geo-Verified</span>
                            </div>
                        )}
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Check-In</div>
                            <div className="text-xl font-black text-gray-900 tracking-tighter">
                                {todayStatus?.checkInTime ? new Date(todayStatus.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Check-Out</div>
                            <div className="text-xl font-black text-gray-900 tracking-tighter">
                                {todayStatus?.checkOutTime ? new Date(todayStatus.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="ent-card flex flex-col items-center justify-center p-8 bg-gray-50/50 border-dashed">
                    {!todayStatus?.checkedIn ? (
                        <button
                            onClick={handleCheckIn}
                            disabled={actionLoading}
                            className="w-36 h-36 rounded-md bg-white border-4 border-gray-100 shadow-xl flex flex-col items-center justify-center group active:scale-95 transition-all duration-300 disabled:opacity-50"
                        >
                            <div className="w-16 h-16 rounded-md bg-primary-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary-200">
                                <LogIn size={24} />
                            </div>
                            <span className="mt-3 text-[10px] font-black text-gray-900 uppercase tracking-widest">
                                {actionLoading ? '...' : 'Check-In'}
                            </span>
                        </button>
                    ) : (
                        <button
                            onClick={handleCheckOut}
                            disabled={actionLoading}
                            className="w-36 h-36 rounded-md bg-white border-4 border-gray-100 shadow-xl flex flex-col items-center justify-center group active:scale-95 transition-all duration-300 disabled:opacity-50"
                        >
                            <div className="w-16 h-16 rounded-md bg-rose-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-rose-200">
                                <LogOut size={24} />
                            </div>
                            <span className="mt-3 text-[10px] font-black text-gray-900 uppercase tracking-widest">
                                {actionLoading ? '...' : 'Check-Out'}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            <div className="ent-card overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendance History</h3>
                    <History size={14} className="text-gray-400" />
                </div>
                <div className="overflow-x-auto">
                    <table className="ent-table">
                        <thead>
                            <tr>
                                <th className="text-[10px] uppercase tracking-widest">Date</th>
                                <th className="text-[10px] uppercase tracking-widest">In</th>
                                <th className="text-[10px] uppercase tracking-widest">Out</th>
                                <th className="text-[10px] uppercase tracking-widest">Status</th>
                                <th className="text-[10px] uppercase tracking-widest text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {attendance.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No history discovered</p>
                                    </td>
                                </tr>
                            ) : (
                                attendance.map((record) => (
                                    <tr key={record.id} className="group hover:bg-primary-50/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-bold text-gray-900 uppercase whitespace-nowrap">
                                                {new Date(record.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-black text-gray-900 tracking-tighter">
                                                {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-black text-gray-900 tracking-tighter">
                                                {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`ent-badge font-bold uppercase ${record.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : record.status === 'absent' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {(record.ipAddress || record.location) ? (
                                                <div className="flex items-center justify-end gap-2 group-hover:translate-x-[-4px] transition-transform" title={`IP: ${record.ipAddress || 'N/A'}`}>
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Verified</span>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${record.location ? 'bg-emerald-500' : 'bg-primary-500'}`} />
                                                </div>
                                            ) : (
                                                <span className="text-[8px] font-bold text-gray-300 uppercase">System</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

