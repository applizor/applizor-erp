'use client';

import { useEffect, useState } from 'react';
import { attendanceApi, holidaysApi, rostersApi } from '@/lib/api/attendance';
import api from '@/lib/api'; // For employees
import { Calendar, ChevronLeft, ChevronRight, Download, Filter, Users } from 'lucide-react';

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
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<string, AttendanceRecord>>>({});
    const [holidays, setHolidays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadData();
    }, [selectedMonth, selectedYear]);

    const formatDate = (date: Date | string) => {
        if (typeof date === 'string') {
            return date.split('T')[0];
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Calculate Date Range
            const startDate = new Date(selectedYear, selectedMonth, 1);
            const endDate = new Date(selectedYear, selectedMonth + 1, 0);

            // 2. Fetch Data in Parallel
            const [empRes, attRes, rosterRes, holidayRes] = await Promise.all([
                api.get('/employees'),
                attendanceApi.getMusterRoll(selectedMonth + 1, selectedYear),
                rostersApi.getRoster(formatDate(startDate), formatDate(endDate)),
                holidaysApi.getAll(selectedYear)
            ]);

            setEmployees(empRes.data);
            setHolidays(holidayRes as any[]);

            // 3. Process Attendance Map
            const map: Record<string, Record<string, any>> = {};
            const holidaysData = holidayRes as any[];
            const roster = rosterRes as any[];
            const matrix = (attRes as any).matrix || [];

            // Parse Matrix Response (Grouped by Employee)
            matrix.forEach((entry: any) => {
                const empId = entry.employee.id;
                if (!map[empId]) map[empId] = {};

                // entry.attendance is { "1": {}, "18": {}, ... }
                Object.entries(entry.attendance).forEach(([dayStr, data]: [string, any]) => {
                    const day = parseInt(dayStr);
                    const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    map[empId][dateKey] = { ...data, source: 'matrix' };
                });
            });

            // Merge Roster (Leaves & Shifts) & Holidays to fill gaps
            roster.forEach((entry: any) => {
                const empId = entry.employeeId;
                if (!map[empId]) map[empId] = {};
                const dateKey = formatDate(entry.date);

                // Existing Data from Matrix
                const existing = map[empId][dateKey];

                // If Matrix already has data (Present, Late, Leave, Holiday), trust it.
                // We only perform calculations if Matrix has no status or 'absent'.
                if (existing && existing.status && existing.status !== 'absent' && existing.status !== 'unknown') {
                    // Just attach shift info for display if needed
                    map[empId][dateKey] = {
                        ...existing,
                        shiftName: entry.shift?.name,
                        leaveType: entry.shift?.name?.replace('Leave: ', '')
                    };
                    return;
                }

                let status = existing?.status || 'absent';

                if (entry.isLeave) {
                    // Approved Leave (if not already appearing in Matrix for some reason)
                    status = 'on-leave';
                } else {
                    // Shift assigned
                    if (existing?.checkIn) {
                        // This path implies Matrix had check-in but no Status.
                        // Calculate Late manually if Matrix didn't
                        const shiftStart = new Date(`${dateKey}T${entry.shift.startTime}`);
                        const checkIn = new Date(existing.checkIn);
                        shiftStart.setMinutes(shiftStart.getMinutes() + 15);

                        if (checkIn > shiftStart) {
                            status = 'late';
                        } else {
                            status = 'present';
                        }
                    } else {
                        // No check-in in Matrix.
                        // Check if it's a holiday?
                        const isHoliday = holidaysData.find(h => formatDate(h.date) === dateKey);
                        if (isHoliday) {
                            status = 'holiday';
                        } else {
                            // If today or past, it's Absent. If future, it's just Shift (display -)
                            // For simplicity, we assume Absent for now, loop render will handle future dashes if needed?
                            // Actually 'absent' color is Red. We might want to avoid Red for future dates.
                            const todayKey = formatDate(new Date());
                            if (dateKey > todayKey) {
                                status = ''; // Future
                            } else {
                                status = 'absent';
                            }
                        }
                    }
                }

                // Double check Holiday
                const isHoliday = holidaysData.find(h => formatDate(h.date) === dateKey);
                if (isHoliday && !entry.isLeave && (!existing || !existing.checkIn)) {
                    status = 'holiday';
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

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'present': return <div className="w-6 h-6 rounded-md flex items-center justify-center bg-green-100 text-green-700 text-xs font-bold" title="Present">P</div>;
            case 'absent': return <div className="w-6 h-6 rounded-md flex items-center justify-center bg-red-100 text-red-700 text-xs font-bold" title="Absent">A</div>;
            case 'half-day': return <div className="w-6 h-6 rounded-md flex items-center justify-center bg-yellow-100 text-yellow-700 text-xs font-bold" title="Half Day">HD</div>;
            case 'late': return <div className="w-6 h-6 rounded-md flex items-center justify-center bg-orange-100 text-orange-700 text-xs font-bold" title="Late">L</div>;
            case 'on-leave': return <div className="w-6 h-6 rounded-md flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold" title="On Leave">OL</div>;
            case 'holiday': return <div className="w-6 h-6 rounded-md flex items-center justify-center bg-purple-100 text-purple-700 text-xs font-bold" title="Holiday">H</div>;
            default: return <div className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 text-xs font-bold">-</div>;
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

    return (
        <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
            {/* Standardized Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm gap-4 mb-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Attendance Register</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">Monthly Muster Roll</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
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
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 px-1">
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-green-100 text-green-700 flex items-center justify-center font-bold mr-2">P</span> Present</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-orange-100 text-orange-700 flex items-center justify-center font-bold mr-2">L</span> Late</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-red-100 text-red-700 flex items-center justify-center font-bold mr-2">A</span> Absent</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold mr-2">OL</span> On Leave</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold mr-2">H</span> Holiday</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold mr-2">HD</span> Half Day</div>
            </div>

            {/* Grid Container */}
            <div className="bg-white shadow rounded-md border flex-grow overflow-auto relative">
                <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
                    <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-30 border-r w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                Employee
                            </th>
                            {days.map(day => (
                                <th key={day.toISOString()} className="px-1 py-2 text-center text-xs font-semibold text-gray-500 uppercase min-w-[40px] border-b">
                                    <div className={`flex flex-col items-center ${[0, 6].includes(day.getDay()) ? 'text-red-500' : ''}`}>
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
                            const presentCount = Object.values(empRecord).filter(r => r.status === 'present' || r.status === 'late').length;

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
                                                    {getStatusIcon(status)}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-3 whitespace-nowrap sticky right-0 bg-white z-10 border-l text-center">
                                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{presentCount} Days</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
