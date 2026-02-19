'use client';

import { useEffect, useState } from 'react';
import { attendanceApi, holidaysApi, rostersApi } from '@/lib/api/attendance';
import api from '@/lib/api'; // For employees
import { Calendar, ChevronLeft, ChevronRight, Download, Filter, Users, X, Loader2, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useToast } from '@/hooks/useToast';
import { Dialog } from '@/components/ui/Dialog';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useConfirm } from '@/context/ConfirmationContext';

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    department?: { name: string };
    employeeId: string;
}

interface AttendanceRecord {
    id: string;
    date: string;
    status: string;
    checkIn?: string;
    checkOut?: string;
    employeeId: string;
}

export default function AdminAttendancePage() {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<string, AttendanceRecord>>>({});
    const [holidays, setHolidays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [offDays, setOffDays] = useState<string[]>([]);
    const [showMarkModal, setShowMarkModal] = useState(false);
    const [marking, setMarking] = useState(false);
    const [manualData, setManualData] = useState<any>({
        employeeId: '',
        dateRange: { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
        status: 'present',
        checkInTime: '09:00',
        checkOutTime: '18:00',
        notes: '',
        skipOffDays: true
    });

    const formatDate = (date: Date | string) => {
        if (typeof date === 'string') {
            return date.split('T')[0];
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        loadData();
    }, [selectedMonth, selectedYear]);

    const loadData = async () => {
        try {
            setLoading(true);

            const startDate = new Date(selectedYear, selectedMonth, 1);
            const endDate = new Date(selectedYear, selectedMonth + 1, 0);

            const [empRes, attRes, rosterRes, holidayRes, companyRes] = await Promise.all([
                api.get('/employees'),
                attendanceApi.getMusterRoll(selectedMonth + 1, selectedYear),
                rostersApi.getRoster(formatDate(startDate), formatDate(endDate)),
                holidaysApi.getAll(selectedYear),
                api.get('/company')
            ]);

            setEmployees(empRes.data);
            setHolidays(holidayRes as any[]);

            if (companyRes.data?.company?.offDays) {
                setOffDays(companyRes.data.company.offDays.split(',').map((s: string) => s.trim()));
            }

            const map: Record<string, Record<string, any>> = {};
            const holidaysData = holidayRes as any[];
            const roster = rosterRes as any[];
            const matrix = (attRes as any).matrix || [];

            matrix.forEach((entry: any) => {
                const empId = entry.employee.id;
                if (!map[empId]) map[empId] = {};
                Object.entries(entry.attendance).forEach(([dayStr, data]: [string, any]) => {
                    const day = parseInt(dayStr);
                    const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    map[empId][dateKey] = { ...data, source: 'matrix' };
                });
            });

            roster.forEach((entry: any) => {
                const empId = entry.employeeId;
                if (!map[empId]) map[empId] = {};
                const dateKey = formatDate(entry.date);
                const existing = map[empId][dateKey];

                const dateObj = new Date(entry.date);
                const isOff = offDays.includes(dateObj.toLocaleDateString('en-US', { weekday: 'long' }));

                if (existing && existing.status && existing.status !== 'absent' && existing.status !== 'unknown' && existing.status !== '') {
                    map[empId][dateKey] = {
                        ...existing,
                        shiftName: entry.shift?.name,
                        leaveType: entry.shift?.name?.replace('Leave: ', '')
                    };
                    return;
                }

                let status = existing?.status || '';
                if (entry.isLeave) {
                    status = 'on-leave';
                } else {
                    if (existing?.checkIn) {
                        const shiftStart = new Date(`${dateKey}T${entry.shift.startTime}`);
                        const checkIn = new Date(existing.checkIn);
                        shiftStart.setMinutes(shiftStart.getMinutes() + 15);
                        status = checkIn > shiftStart ? 'late' : 'present';
                    } else {
                        const isHoliday = holidaysData.find(h => formatDate(h.date) === dateKey);
                        if (isHoliday) {
                            status = 'holiday';
                        } else if (isOff) {
                            status = 'weekend';
                        } else {
                            const todayKey = formatDate(new Date());
                            status = dateKey > todayKey ? '' : 'absent';
                        }
                    }
                }

                map[empId][dateKey] = {
                    ...existing,
                    status,
                    shiftName: entry.shift?.name,
                    leaveType: entry.shift?.name?.replace('Leave: ', '')
                };
            });
            setAttendanceMap(map);
        } catch (error) {
            console.error('Failed to load muster roll:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = () => {
        const date = new Date(selectedYear, selectedMonth, 1);
        const days = [];
        while (date.getMonth() === selectedMonth) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const days = getDaysInMonth();

    const handleCellClick = (employeeId: string, dateKey: string, currentStatus?: string) => {
        setManualData({
            employeeId,
            dateRange: { start: dateKey, end: dateKey },
            status: currentStatus || 'present',
            checkInTime: '09:00',
            checkOutTime: '18:00',
            notes: '',
            skipOffDays: true
        });
        setShowMarkModal(true);
    };

    const getStatusIcon = (status?: string, date?: Date, onClick?: () => void) => {
        const iconClass = "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-110 transition-transform shadow-sm";
        if (!status && date && isOffDay(date)) {
            return <div onClick={onClick} className={`${iconClass} bg-gray-50 text-gray-400 text-[10px] font-black`} title="Weekend Off">OFF</div>;
        }
        switch (status) {
            case 'present': return <div onClick={onClick} className={`${iconClass} bg-green-100 text-green-700`} title="Present">P</div>;
            case 'absent': return <div onClick={onClick} className={`${iconClass} bg-red-100 text-red-700`} title="Absent">A</div>;
            case 'half-day': return <div onClick={onClick} className={`${iconClass} bg-yellow-100 text-yellow-700`} title="Half Day">HD</div>;
            case 'late': return <div onClick={onClick} className={`${iconClass} bg-orange-100 text-orange-700`} title="Late">L</div>;
            case 'on-leave': return <div onClick={onClick} className={`${iconClass} bg-blue-100 text-blue-700`} title="On Leave">OL</div>;
            case 'holiday': return <div onClick={onClick} className={`${iconClass} bg-purple-100 text-purple-700`} title="Holiday">H</div>;
            case 'weekend': return <div onClick={onClick} className={`${iconClass} bg-gray-50 text-gray-400 text-[10px] font-black`} title="Weekend Off">OFF</div>;
            default: return <div onClick={onClick} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 text-xs font-bold cursor-pointer hover:bg-gray-50" title="Click to mark">-</div>;
        }
    };

    const handlePreviousMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const handleManualMark = async () => {
        if (!manualData.employeeId) return toast.error('Please select an employee');
        setMarking(true);
        try {
            const start = new Date(manualData.dateRange.start);
            const end = new Date(manualData.dateRange.end);
            const assignments = [];

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = formatDate(new Date(d));

                // Combine date with time strings
                const checkInISO = manualData.checkInTime ? `${dateStr}T${manualData.checkInTime}:00` : null;
                const checkOutISO = manualData.checkOutTime ? `${dateStr}T${manualData.checkOutTime}:00` : null;

                assignments.push({
                    employeeId: manualData.employeeId,
                    date: dateStr,
                    status: manualData.status,
                    checkIn: checkInISO,
                    checkOut: checkOutISO,
                    notes: manualData.notes
                });
            }

            await api.post('/attendance-leave/attendance/manual', {
                assignments,
                skipOffDays: manualData.skipOffDays
            });
            toast.success('Attendance records updated');
            setShowMarkModal(false);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to mark attendance');
        } finally {
            setMarking(false);
        }
    };

    const isOffDay = (date: Date) => {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        return offDays.includes(dayName);
    };

    return (
        <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
            <PageHeader
                title="Attendance Register"
                subtitle="Monthly Muster Roll"
                icon={Users}
                actions={
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowMarkModal(true)}
                            className="btn-primary flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest"
                        >
                            <Calendar size={14} />
                            Mark Attendance
                        </button>

                        <div className="flex items-center bg-white rounded-md shadow-sm border border-gray-300">
                            <button onClick={handlePreviousMonth} className="p-2 hover:bg-gray-50 border-r">
                                <ChevronLeft size={20} />
                            </button>
                            <div className="px-4 py-2 font-medium min-w-[150px] text-center text-sm">
                                {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </div>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-50 border-l">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 text-[10px] font-black uppercase tracking-widest">
                                <Filter size={14} />
                                <span>Filter</span>
                            </button>
                            <button className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                <Download size={14} />
                                <span>Export</span>
                            </button>
                        </div>
                    </div>
                }
            />

            <div className="flex flex-wrap gap-4 mb-4 px-1">
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-green-100 text-green-700 flex items-center justify-center font-bold mr-2">P</span> Present</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-orange-100 text-orange-700 flex items-center justify-center font-bold mr-2">L</span> Late</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-red-100 text-red-700 flex items-center justify-center font-bold mr-2">A</span> Absent</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold mr-2">OL</span> On Leave</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold mr-2">H</span> Holiday</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold mr-2">HD</span> Half Day</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-gray-50 text-gray-400 flex items-center justify-center font-bold mr-2 text-[8px]">OFF</span> Weekend</div>
            </div>

            <div className="bg-white shadow rounded-md border flex-grow overflow-auto relative">
                <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
                    <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-30 border-r w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                Employee
                            </th>
                            {days.map(day => (
                                <th key={day.toISOString()} className="px-1 py-2 text-center text-xs font-semibold text-gray-500 uppercase min-w-[40px] border-b">
                                    <div className={`flex flex-col items-center ${isOffDay(day) ? 'text-red-500' : ''}`}>
                                        <span>{day.getDate()}</span>
                                        <span className="text-[10px] opacity-75">{day.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                                    </div>
                                </th>
                            ))}
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-30 border-l w-24">
                                Stats
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-4 py-3 sticky left-0 bg-white border-r"><div className="h-4 bg-gray-200 rounded-md w-32"></div></td>
                                    {Array.from({ length: 30 }).map((_, j) => (
                                        <td key={j} className="px-1 py-2"><div className="h-4 w-4 bg-gray-100 rounded-md mx-auto"></div></td>
                                    ))}
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded-md w-8 mx-auto"></div></td>
                                </tr>
                            ))
                        ) : employees.map(emp => {
                            const empRecord = attendanceMap[emp.id] || {};
                            const today = new Date();
                            today.setHours(23, 59, 59, 999);

                            const stats = Object.entries(empRecord).reduce((acc, [dateKey, r]) => {
                                const date = new Date(dateKey);
                                if (date > today) return acc; // Don't count future days

                                if (r.status === 'present' || r.status === 'late') acc.present++;
                                if (r.status === 'absent') acc.absent++;
                                if (r.status === 'on-leave') {
                                    if ((r as any).isPaid) acc.leave++;
                                    else acc.unpaidLeave++;
                                }
                                if (r.status === 'holiday') acc.holiday++;
                                if (r.status === 'weekend') acc.weekend++;
                                if (r.status === 'half-day') acc.halfDay++;
                                return acc;
                            }, { present: 0, absent: 0, leave: 0, holiday: 0, weekend: 0, halfDay: 0, unpaidLeave: 0 });

                            // Net Paid Days Calculation
                            const totalPaidDays = stats.present + stats.holiday + stats.weekend + stats.leave + (stats.halfDay * 0.5);

                            return (
                                <tr key={emp.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 rounded-md bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                                                {emp.firstName[0]}{emp.lastName[0]}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</div>
                                                <div className="text-xs text-gray-500">{emp.employeeId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {days.map(day => {
                                        const dateKey = formatDate(day);
                                        const record = empRecord[dateKey];
                                        let status = record?.status;

                                        if (!status) {
                                            const isHoliday = holidays.find((h: any) => formatDate(new Date(h.date)) === dateKey);
                                            if (isHoliday) status = 'holiday';
                                        }

                                        return (
                                            <td key={dateKey} className="px-1 py-2 text-center border-b border-gray-50">
                                                <div className="flex justify-center">
                                                    {getStatusIcon(status, day, () => handleCellClick(emp.id, dateKey, status))}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-3 whitespace-nowrap sticky right-0 bg-white z-10 border-l text-center">
                                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{totalPaidDays} Days</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Manual Mark Modal */}
            <Dialog
                isOpen={showMarkModal}
                onClose={() => setShowMarkModal(false)}
                title="Manage Attendance Entry"
                maxWidth="md"
            >
                <div className="space-y-4">
                    <div className="ent-form-group">
                        <label className="ent-label">Select Employee</label>
                        <CustomSelect
                            options={employees.map(e => ({ label: `${e.firstName} ${e.lastName} (${e.employeeId})`, value: e.id }))}
                            value={manualData.employeeId}
                            onChange={(val) => setManualData({ ...manualData, employeeId: val })}
                            placeholder="Choose employee..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="ent-form-group">
                            <label className="ent-label">Start Date</label>
                            <input
                                type="date"
                                className="ent-input w-full"
                                value={manualData.dateRange.start}
                                onChange={(e) => setManualData({ ...manualData, dateRange: { ...manualData.dateRange, start: e.target.value } })}
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">End Date</label>
                            <input
                                type="date"
                                className="ent-input w-full"
                                value={manualData.dateRange.end}
                                onChange={(e) => setManualData({ ...manualData, dateRange: { ...manualData.dateRange, end: e.target.value } })}
                            />
                        </div>
                    </div>

                    <div className="ent-form-group">
                        <label className="ent-label">Status</label>
                        <CustomSelect
                            options={[
                                { label: 'Present', value: 'present' },
                                { label: 'Absent', value: 'absent' },
                                { label: 'Half Day', value: 'half-day' },
                                { label: 'Late', value: 'late' }
                            ]}
                            value={manualData.status}
                            onChange={(val) => setManualData({ ...manualData, status: val })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="ent-form-group">
                            <label className="ent-label">Check-In Time</label>
                            <input
                                type="time"
                                className="ent-input w-full"
                                value={manualData.checkInTime}
                                onChange={(e) => setManualData({ ...manualData, checkInTime: e.target.value })}
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">Check-Out Time</label>
                            <input
                                type="time"
                                className="ent-input w-full"
                                value={manualData.checkOutTime}
                                onChange={(e) => setManualData({ ...manualData, checkOutTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="ent-form-group">
                        <label className="ent-label">Notes (Optional)</label>
                        <textarea
                            className="ent-input w-full h-20 resize-none"
                            placeholder="Reason for manual entry..."
                            value={manualData.notes}
                            onChange={(e) => setManualData({ ...manualData, notes: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-2 px-1">
                        <input
                            type="checkbox"
                            id="skipOffDaysAdmin"
                            checked={manualData.skipOffDays}
                            onChange={(e) => setManualData({ ...manualData, skipOffDays: e.target.checked })}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="skipOffDaysAdmin" className="text-xs font-bold text-gray-700 cursor-pointer">
                            Skip Company Off-Days (Weekends)
                        </label>
                    </div>

                    <div className="flex justify-between mt-6">
                        {/* Delete Button (Left Aligned) */}
                        <button
                            onClick={async () => {
                                if (!manualData.employeeId) return toast.error('Please select an employee');
                                if (!await confirm({ message: 'Are you sure you want to delete these attendance records? This action cannot be undone.', type: 'danger' })) return;

                                setMarking(true);
                                try {
                                    const start = new Date(manualData.dateRange.start);
                                    const end = new Date(manualData.dateRange.end);
                                    const promises = [];

                                    // Helper to clone date to avoid loop issues
                                    const current = new Date(start);
                                    while (current <= end) {
                                        const dateStr = formatDate(new Date(current));
                                        promises.push(attendanceApi.deleteRecord(manualData.employeeId, dateStr));
                                        current.setDate(current.getDate() + 1);
                                    }

                                    await Promise.all(promises);
                                    toast.success('Attendance records deleted');
                                    setShowMarkModal(false);
                                    loadData();
                                } catch (error: any) {
                                    toast.error(error.response?.data?.error || 'Failed to delete records');
                                } finally {
                                    setMarking(false);
                                }
                            }}
                            disabled={marking}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            <Trash2 size={14} />
                            {marking ? 'Processing...' : 'Delete'}
                        </button>

                        {/* Save Actions (Right Aligned) */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowMarkModal(false)}
                                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleManualMark}
                                disabled={marking}
                                className="btn-primary flex items-center gap-2 px-6 py-2"
                            >
                                {marking ? <Loader2 size={14} className="animate-spin" /> : null}
                                {marking ? 'Processing...' : 'Save Entry'}
                            </button>
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
