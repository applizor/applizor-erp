import { Bell, LogOut, Search, User, Settings, HelpCircle, ChevronDown, Clock, Menu, Building2 } from 'lucide-react';
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
            let latitude: number | null = null;
            let longitude: number | null = null;
            if (typeof navigator !== 'undefined' && navigator.geolocation) {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: false,
                            timeout: 4000,
                            maximumAge: 60000,
                        });
                    });
                    latitude = pos.coords.latitude;
                    longitude = pos.coords.longitude;
                } catch {
                    // Geo optional — continue without coordinates
                }
            }
            await api.post('/attendance-leave/check-in', { latitude, longitude });
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

    // ⌘K global search shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const input = document.querySelector<HTMLInputElement>('input[placeholder*="Global search"]');
                input?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleOpenMenu = () => {
        window.dispatchEvent(new CustomEvent('open-mobile-menu'));
    };

    return (
        <header className="app-header">
            {/* Mobile Menu Trigger & Brand */}
            <div className="flex items-center gap-3 md:hidden">
                <button 
                    onClick={handleOpenMenu}
                    className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors duration-200"
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Building2 size={16} className="text-white" />
                    </div>
                    <span className="text-sm font-black tracking-tight text-primary-900 uppercase">Applizor</span>
                </div>
            </div>

            {/* Left Side (Search - Desktop only) */}
            <div className="relative flex-1 max-w-md hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <input
                    type="text"
                    placeholder="Global search... (⌘K)"
                    className="app-search"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const query = (e.target as HTMLInputElement).value.trim();
                            if (query) {
                                window.location.href = `/search?q=${encodeURIComponent(query)}`;
                            }
                        }
                    }}
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100/80 rounded border border-slate-200/60">
                    ⌘K
                </kbd>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1.5 md:gap-3">

                {/* Attendance Button */}
                {statusFetched && !checkedOut && !isAdmin && (
                    <div className="flex items-center gap-2">
                        {checkInTime && (
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight hidden md:inline-block">
                                In: {new Date(checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                        )}
                        <button
                            onClick={checkedIn ? handleCheckOut : handleCheckIn}
                            disabled={attendanceLoading}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider
                                transition-[background-color,border-color,box-shadow] duration-200 shadow-sm
                                ${checkedIn
                                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
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
                    <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 cursor-default">
                        <div className="flex flex-col items-end leading-none gap-0.5">
                            <span className="text-[9px] font-bold">
                                IN: {checkInTime ? new Date(checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--'}
                            </span>
                            <span className="text-[9px] font-bold">
                                OUT: {checkOutTime ? new Date(checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--'}
                            </span>
                        </div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Completed</span>
                        </div>
                    </div>
                )}

                <NotificationCenter />

                <Link
                    href="/helpdesk"
                    className="hidden md:flex p-2 text-slate-500 hover:bg-slate-50 hover:text-primary-600 rounded-lg transition-colors duration-200"
                    title="Helpdesk"
                >
                    <HelpCircle size={18} />
                </Link>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 pl-2 pr-1.5 py-1 rounded-lg transition-colors duration-200 border border-transparent hover:bg-slate-50 hover:border-slate-100"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-[11px] font-black text-slate-900 leading-none">{user?.firstName} {user?.lastName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                                {(() => {
                                    const roles = user?.roles || [];
                                    const first = roles[0];
                                    if (typeof first === 'string') return first;
                                    if (first && typeof first === 'object' && (first as any).role?.name) return (first as any).role.name;
                                    if (first && typeof first === 'object' && (first as any).name) return (first as any).name;
                                    return 'User';
                                })()}
                            </p>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 text-white flex items-center justify-center font-black text-xs shadow-sm ring-2 ring-white">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-100 py-1 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                            <div className="px-4 py-3 border-b border-slate-50 md:hidden">
                                <p className="text-sm font-black text-slate-900">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-slate-500">{user?.email}</p>
                            </div>

                            <div className="p-1">
                                <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-slate-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors duration-150">
                                    <User size={14} /> My Profile
                                </Link>
                                <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-slate-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors duration-150">
                                    <Settings size={14} /> Settings
                                </Link>
                            </div>

                            <div className="border-t border-slate-50 p-1 mt-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-md transition-colors duration-150"
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
