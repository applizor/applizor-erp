import { Bell, LogOut, Search, User, Settings, HelpCircle, ChevronDown, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { auth } from '@/lib/auth';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import NotificationCenter from './NotificationCenter';

export default function TopHeader() {
    const { user } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    // Attendance State
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [checkedIn, setCheckedIn] = useState(false);
    const [checkedOut, setCheckedOut] = useState(false);
    const [checkInTime, setCheckInTime] = useState<string | null>(null);
    const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
    const [statusFetched, setStatusFetched] = useState(false);

    const handleLogout = () => {
        auth.logout();
        window.location.href = '/login';
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Fetch Attendance Status on Mount
    useEffect(() => {
        if (user) {
            fetchStatus();
        }
    }, [user]);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/attendance-leave/today-status');
            setCheckedIn(res.data.checkedIn);
            setCheckedOut(res.data.checkedOut);
            setCheckInTime(res.data.checkInTime);
            setCheckOutTime(res.data.checkOutTime);
        } catch (error) {
            console.error('Failed to fetch attendance status', error);
        } finally {
            setStatusFetched(true);
        }
    };

    const isAdmin = user?.roles?.some((r: any) => r.role?.name === 'Admin' || r.role?.name === 'Super Admin' || r === 'Admin' || r === 'Super Admin');

    const handleCheckIn = async () => {
        setAttendanceLoading(true);
        try {
            await api.post('/attendance-leave/check-in', {
                latitude: null, // Optional: Add geo logic later if needed
                longitude: null
            });
            toast.success('Checked in successfully!');
            await fetchStatus();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Failed to check in');
        } finally {
            setAttendanceLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setAttendanceLoading(true);
        try {
            await api.post('/attendance-leave/check-out');
            toast.success('Checked out successfully!');
            await fetchStatus();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Failed to check out');
        } finally {
            setAttendanceLoading(false);
        }
    };

    return (
        <header className="h-14 bg-white border-b border-gray-200 sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between shadow-sm">
            {/* Left Side (Search or Breadcrumbs - Placeholder for now) */}
            <div className="flex items-center gap-4 flex-1">
                <div className="hidden md:flex items-center relative max-w-md w-full">
                    <Search className="absolute left-3 w-3.5 h-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Global search..."
                        className="ent-input w-full pl-9 py-1.5 text-[11px] font-medium placeholder:text-gray-400 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                    />
                    <div className="absolute right-2 flex gap-1">
                        <span className="text-[9px] font-black text-gray-300 border border-gray-200 rounded px-1.5 bg-white">⌘</span>
                        <span className="text-[9px] font-black text-gray-300 border border-gray-200 rounded px-1.5 bg-white">K</span>
                    </div>
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 md:gap-4">

                {/* Attendance Button */}
                {statusFetched && !checkedOut && !isAdmin && (
                    <div className="flex items-center gap-2">
                        {checkInTime && (
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight hidden md:inline-block">
                                In: {new Date(checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                        )}
                        <button
                            onClick={checkedIn ? handleCheckOut : handleCheckIn}
                            disabled={attendanceLoading}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all shadow-sm
                                ${checkedIn
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                                }
                                ${attendanceLoading ? 'opacity-70 cursor-wait' : ''}
                            `}
                        >
                            <Clock size={14} />
                            {attendanceLoading ? 'Processing...' : (checkedIn ? 'Check Out' : 'Check In')}
                        </button>
                    </div>
                )}
                {statusFetched && checkedOut && !isAdmin && (
                    <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-gray-400 cursor-default">
                        <div className="flex flex-col items-end leading-none gap-0.5">
                            <span className="text-[9px] font-bold">
                                IN: {checkInTime ? new Date(checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--'}
                            </span>
                            <span className="text-[9px] font-bold">
                                OUT: {checkOutTime ? new Date(checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--'}
                            </span>
                        </div>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Completed</span>
                        </div>
                    </div>
                )}

                {/* Notifications */}
                {/* Notifications */}
                <NotificationCenter />

                {/* Help/Support */}
                <button className="hidden md:flex p-2 text-gray-500 hover:bg-gray-50 hover:text-primary-600 rounded-md transition-all">
                    <HelpCircle size={18} />
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-md hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-[11px] font-black text-gray-900 leading-none">{user?.firstName} {user?.lastName}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Admin</p>
                        </div>
                        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary-600 to-primary-800 text-white flex items-center justify-center font-black text-xs shadow-sm">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-md shadow-xl border border-gray-100 py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                            <div className="px-4 py-3 border-b border-gray-50 md:hidden">
                                <p className="text-sm font-black text-gray-900">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>

                            <div className="p-1">
                                <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-gray-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors">
                                    <User size={14} /> My Profile
                                </Link>
                                <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-gray-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors">
                                    <Settings size={14} /> Settings
                                </Link>
                            </div>

                            <div className="border-t border-gray-50 p-1 mt-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                >
                                    <LogOut size={14} /> Logout Session
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
