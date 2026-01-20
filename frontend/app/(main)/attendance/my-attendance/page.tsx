'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { attendanceApi, holidaysApi, Holiday } from '@/lib/api/attendance';
import { Clock, LogIn, LogOut, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

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

    useEffect(() => {
        loadData();
        // Request location on load
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => {
                    setLocError('Location access denied. Geo-fencing check-in may fail.');
                    console.warn('Geolocation error:', err);
                }
            );
        } else {
            setLocError('Geolocation not supported by this browser.');
        }
    }, []);

    const [todayHoliday, setTodayHoliday] = useState<any>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [historyData, statusData] = await Promise.all([
                attendanceApi.getMyAttendance(),
                attendanceApi.todayStatus()
            ]);
            setAttendance(historyData);
            setTodayStatus(statusData);

            // Check for Holiday
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
            loadData();
        } catch (error: any) {
            console.error('Check-in failed:', error);
            toast.error(error.response?.data?.error || 'Check-in failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        try {
            setActionLoading(true);
            await attendanceApi.checkOut();
            loadData();
        } catch (error: any) {
            console.error('Check-out failed:', error);
            toast.error(error.response?.data?.error || 'Check-out failed');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Attendance</h2>
                <Link href="/attendance/leaves" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                    Apply for Leave &rarr;
                </Link>
            </div>

            {/* Holiday Banner */}
            {todayHoliday && (
                <div className="bg-teal-50 border-l-4 border-teal-500 p-4 mb-6 rounded-r-md shadow-sm">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Clock className="h-5 w-5 text-teal-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-teal-700">
                                <span className="font-bold">Holiday:</span> Today is <span className="font-medium">{todayHoliday.name}</span>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Today's Status Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Today's Status</h3>
                        <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        {todayStatus?.checkInTime && (
                            <div className="mt-2 text-sm text-gray-600">
                                Checked In: <span className="font-mono font-medium">{new Date(todayStatus.checkInTime).toLocaleTimeString()}</span>
                            </div>
                        )}
                        {todayStatus?.checkOutTime && (
                            <div className="text-sm text-gray-600">
                                Checked Out: <span className="font-mono font-medium">{new Date(todayStatus.checkOutTime).toLocaleTimeString()}</span>
                            </div>
                        )}
                        {locError && (
                            <div className="mt-2 flex items-center text-xs text-amber-600">
                                <AlertTriangle size={12} className="mr-1" />
                                {locError}
                            </div>
                        )}
                        {location && (
                            <div className="mt-1 flex items-center text-xs text-green-600">
                                <MapPin size={12} className="mr-1" />
                                Location Acquired
                            </div>
                        )}
                    </div>

                    <div className="mt-4 md:mt-0 flex space-x-4">
                        {/* Show Check In if NOT checked in (either no record or last record is checked out) */}
                        {!todayStatus?.checkedIn && (
                            <button
                                onClick={handleCheckIn}
                                disabled={actionLoading}
                                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <LogIn size={20} />
                                <span>{actionLoading ? 'Processing...' : 'Check In'}</span>
                            </button>
                        )}

                        {/* Show Check Out if currently checked in */}
                        {todayStatus?.checkedIn && (
                            <button
                                onClick={handleCheckOut}
                                disabled={actionLoading}
                                className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <LogOut size={20} />
                                <span>{actionLoading ? 'Processing...' : 'Check Out'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Attendance History */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Attendance History</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {attendance.map((record) => (
                        <li key={record.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-indigo-600">
                                        {new Date(record.date).toLocaleDateString()}
                                    </span>
                                    <span className={`text-xs inline-flex w-fit mt-1 px-2 py-0.5 rounded-full capitalize ${record.status === 'present' ? 'bg-green-100 text-green-800' :
                                        record.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {record.status}
                                    </span>
                                </div>
                                <div className="flex space-x-6">
                                    <div className="flex flex-col items-end">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">In</p>
                                        <p className="text-sm font-mono text-gray-900">
                                            {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '--:--'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Out</p>
                                        <p className="text-sm font-mono text-gray-900">
                                            {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '--:--'}
                                        </p>
                                    </div>
                                    {(record.ipAddress || record.location) && (
                                        <div className="hidden sm:flex flex-col items-end w-24">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Info</p>
                                            <p className="text-xs text-gray-400 truncate w-full text-right" title={`IP: ${record.ipAddress}\nLoc: ${record.location}`}>
                                                {record.location ? '📍 Loc' : '🌐 IP'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                    {attendance.length === 0 && (
                        <li className="px-6 py-8 text-center text-gray-500">No attendance history found.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}

