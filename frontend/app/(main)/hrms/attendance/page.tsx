'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import { attendanceApi, Attendance } from '@/lib/api/attendance';
import { auth } from '@/lib/auth';

import { MapPin, Search } from 'lucide-react';

export default function AttendancePage() {
    const toast = useToast();
    const user = auth.getUser() as any; // Cast to any to access role for now
    const isAdmin = user?.role === 'admin' || user?.role === 'hr_manager';
    const [activeTab, setActiveTab] = useState('my-attendance');

    // My Attendance State
    const [todayStatus, setTodayStatus] = useState<any>(null);
    const [myHistory, setMyHistory] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);

    // Admin State
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
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        setGeoLoading(true);
        if (!navigator.geolocation) {
            toast.info('Geolocation is not supported by your browser');
            setGeoLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                await attendanceApi.checkIn({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                toast.success('Checked in successfully!');
                loadMyData();
            } catch (error: any) {
                toast.error(error.response?.data?.error || 'Check-in failed');
            } finally {
                setGeoLoading(false);
            }
        }, (error) => {
            console.error('Geo Error:', error);
            toast.info('Unable to retrieve your location. Please allow location access.');
            setGeoLoading(false);
        });
    };

    const handleCheckOut = async () => {
        if (!confirm('Are you sure you want to check out?')) return;
        try {
            await attendanceApi.checkOut();
            toast.success('Checked out successfully!');
            loadMyData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Check-out failed');
        }
    };

    const renderMyAttendance = () => (
        <div className="space-y-6">
            {/* Action Card */}
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center space-y-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                    <p className="text-gray-500 mt-1">
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>

                <div className="flex items-center space-x-4">
                    {!todayStatus?.checkedIn ? (
                        <button
                            onClick={handleCheckIn}
                            disabled={geoLoading}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-lg flex items-center text-lg disabled:opacity-50"
                        >
                            <MapPin className="mr-2 h-6 w-6" />
                            {geoLoading ? 'Getting Location...' : 'Check In'}
                        </button>
                    ) : !todayStatus?.checkedOut ? (
                        <button
                            onClick={handleCheckOut}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full shadow-lg flex items-center text-lg"
                        >
                            <LogOutIcon className="mr-2 h-6 w-6" />
                            Check Out
                        </button>
                    ) : (
                        <div className="text-gray-600 font-medium py-2 px-4 bg-gray-100 rounded-full">
                            ✅ Attendance Completed for Today
                        </div>
                    )}
                </div>

                {todayStatus?.checkedIn && (
                    <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-md text-sm">
                        Checked in at: {new Date(todayStatus.checkInTime).toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* History List */}
            <h3 className="text-lg font-medium text-gray-900 mt-8">My History</h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {myHistory.map((record) => (
                        <li key={record.id} className="px-6 py-4 flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-900">
                                    {new Date(record.date).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                                    {' ➔ '}
                                    {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                                </div>
                            </div>
                            <div>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${record.status === 'present' ? 'bg-green-100 text-green-800' :
                                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'}`}>
                                    {record.status}
                                </span>
                            </div>
                        </li>
                    ))}
                    {myHistory.length === 0 && (
                        <li className="px-6 py-4 text-center text-gray-500">No records found.</li>
                    )}
                </ul>
            </div>
        </div>
    );

    const renderAdminLogs = () => (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white p-4 rounded-md shadow flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700">Date</label>
                    <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700">Employee Name</label>
                    <input type="text" placeholder="Search..." value={filters.employeeName} onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div className="flex items-end">
                    <button onClick={loadAdminData} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                        <Search className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {adminLogs.map((log: any) => (
                            <tr key={log.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {log.employee?.firstName} {log.employee?.lastName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(log.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {log.checkIn ? new Date(log.checkIn).toLocaleTimeString() : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {log.checkOut ? new Date(log.checkOut).toLocaleTimeString() : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${log.status === 'present' ? 'bg-green-100 text-green-800' :
                                            log.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'}`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {log.notes}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    function LogOutIcon(props: any) {
        return (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
        )
    }

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Center</h1>
                </div>

                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('my-attendance')}
                            className={`${activeTab === 'my-attendance' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            My Attendance
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('admin-logs')}
                                className={`${activeTab === 'admin-logs' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Admin Logs
                            </button>
                        )}
                    </nav>
                </div>

                {activeTab === 'my-attendance' && renderMyAttendance()}
                {activeTab === 'admin-logs' && renderAdminLogs()}
            </div>
        </div>
    );
}
