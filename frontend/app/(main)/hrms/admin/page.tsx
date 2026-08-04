'use client';

import { useEffect, useMemo, useState } from 'react';
import { attendanceApi, holidaysApi, rostersApi } from '@/lib/api/attendance';
import api from '@/lib/api'; // For employees
import { departmentsApi, positionsApi, Department, Position } from '@/lib/api/hrms';
import { Calendar, ChevronLeft, ChevronRight, Download, Filter, Users, X, Loader2, Trash2, Search } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useToast } from '@/hooks/useToast';
import { Dialog } from '@/components/ui/Dialog';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useConfirm } from '@/context/ConfirmationContext';

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    departmentId?: string | null;
    positionId?: string | null;
    department?: { id?: string; name: string } | null;
    position?: { id?: string; title: string } | null;
    employeeId: string;
    status?: string;
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
    const [showFilters, setShowFilters] = useState(true);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterPosition, setFilterPosition] = useState('');
    const [filterEmpStatus, setFilterEmpStatus] = useState('active');
    const [filterAttStatus, setFilterAttStatus] = useState('');
    const [manualData, setManualData] = useState<any>({
        employeeId: '',
        dateRange: { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
        status: 'present',
        checkInTime: '09:00',
        checkOutTime: '18:00',
        notes: '',
        skipOffDays: true,
        leaveType: '',
        durationType: '',
        isPaid: true
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

    useEffect(() => {
        if (!filterDepartment) {
            positionsApi.getAll().then(setPositions).catch(() => setPositions([]));
            return;
        }
        positionsApi.getAll(filterDepartment).then(setPositions).catch(() => setPositions([]));
        setFilterPosition('');
    }, [filterDepartment]);

    const loadData = async () => {
        try {
            setLoading(true);

            const startDate = new Date(selectedYear, selectedMonth, 1);
            const endDate = new Date(selectedYear, selectedMonth + 1, 0);

            const [empRes, attRes, rosterRes, holidayRes, companyRes, deptRes] = await Promise.all([
                api.get('/employees'),
                attendanceApi.getMusterRoll(selectedMonth + 1, selectedYear),
                rostersApi.getRoster(formatDate(startDate), formatDate(endDate)),
                holidaysApi.getAll(selectedYear),
                api.get('/company'),
                departmentsApi.getAll().catch(() => []),
            ]);

            setEmployees(empRes.data);
            setDepartments(Array.isArray(deptRes) ? deptRes : []);
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

    const handleCellClick = (employeeId: string, dateKey: string, currentStatus?: string, record?: any) => {
        const formatTimeFromISO = (dt?: string) => {
            if (!dt) return '';
            const d = new Date(dt);
            return isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        };

        const isLeaveRecord = currentStatus === 'leave' || currentStatus === 'on-leave' || record?.isLeave;

        setManualData({
            employeeId,
            dateRange: { start: dateKey, end: dateKey },
            status: currentStatus || 'present',
            checkInTime: record?.checkIn ? formatTimeFromISO(record.checkIn) : '09:00',
            checkOutTime: record ? (record?.checkOut ? formatTimeFromISO(record.checkOut) : '') : '18:00',
            notes: (isLeaveRecord ? `[Leave: ${record?.leaveType || ''} ${record?.durationType === 'half' || record?.durationType === 'first_half' ? '(First Half)' : record?.durationType === 'second_half' ? '(Second Half)' : ''}] ` : '') + (record?.notes || ''),
            skipOffDays: true,
            leaveType: record?.leaveType || '',
            durationType: record?.durationType || '',
            isPaid: record?.isPaid !== undefined ? record?.isPaid : true
        });
        setShowMarkModal(true);
    };

    const getStatusIcon = (status?: string, date?: Date, onClick?: () => void, record?: any) => {
        const iconClass = "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-110 transition-transform shadow-sm";
        if (!status && date && isOffDay(date)) {
            return <div onClick={onClick} className={`${iconClass} bg-gray-50 text-gray-400 text-[10px] font-black`} title="Weekend Off">OFF</div>;
        }

        let effectiveStatus = status;
        if ((status === 'leave' || status === 'on-leave') && (record?.durationType === 'half' || record?.durationType === 'first_half' || record?.durationType === 'second_half')) {
            effectiveStatus = 'half-day-leave';
        }

        if (record?.onLeaveButPresent) {
            return <div onClick={onClick} className={`${iconClass} bg-violet-100 text-violet-700 ring-2 ring-violet-300 ring-offset-1`} title={`Present (On Leave: ${record.leaveType || 'Leave'})`}>P</div>;
        }

        switch (effectiveStatus) {
            case 'present': return <div onClick={onClick} className={`${iconClass} bg-green-100 text-green-700`} title="Present">P</div>;
            case 'absent': return <div onClick={onClick} className={`${iconClass} bg-red-100 text-red-700`} title="Absent">A</div>;
            case 'half-day':
            case 'half-day-leave': return <div onClick={onClick} className={`${iconClass} bg-yellow-100 text-yellow-700`} title={record?.durationType === 'second_half' ? 'Half Day Leave (Second Half)' : 'Half Day Leave (First Half)'}>HD</div>;
            case 'late': return <div onClick={onClick} className={`${iconClass} bg-orange-100 text-orange-700`} title="Late">L</div>;
            case 'on-leave':
            case 'leave': return <div onClick={onClick} className={`${iconClass} bg-blue-100 text-blue-700`} title="On Leave">OL</div>;
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

    const employeeHasAttendanceStatus = (empId: string, statusFilter: string) => {
        const records = attendanceMap[empId] || {};
        return Object.values(records).some((r: any) => {
            const st = r?.status || '';
            if (statusFilter === 'on-leave') return st === 'on-leave' || st === 'leave';
            if (statusFilter === 'half-day') return st === 'half-day' || r?.durationType === 'half' || r?.durationType === 'first_half' || r?.durationType === 'second_half';
            if (statusFilter === 'present-on-leave') return !!r?.onLeaveButPresent;
            return st === statusFilter;
        });
    };

    const filteredEmployees = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return employees.filter((emp) => {
            if (q) {
                const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
                const empCode = String(emp.employeeId || '').toLowerCase();
                if (!fullName.includes(q) && !empCode.includes(q)) return false;
            }

            const deptId = emp.departmentId || emp.department?.id || '';
            if (filterDepartment && deptId !== filterDepartment) return false;

            const posId = emp.positionId || emp.position?.id || '';
            if (filterPosition && posId !== filterPosition) return false;

            if (filterEmpStatus) {
                const status = (emp.status || 'active').toLowerCase();
                if (status !== filterEmpStatus.toLowerCase()) return false;
            }

            if (filterAttStatus && !employeeHasAttendanceStatus(emp.id, filterAttStatus)) return false;

            return true;
        });
    }, [employees, searchQuery, filterDepartment, filterPosition, filterEmpStatus, filterAttStatus, attendanceMap]);

    const activeFilterCount = [
        searchQuery.trim(),
        filterDepartment,
        filterPosition,
        filterEmpStatus && filterEmpStatus !== 'active' ? filterEmpStatus : '',
        filterAttStatus,
    ].filter(Boolean).length;

    const monthSummary = useMemo(() => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        let present = 0;
        let absent = 0;
        let late = 0;
        let leave = 0;
        let halfDay = 0;
        filteredEmployees.forEach((emp) => {
            const records = attendanceMap[emp.id] || {};
            Object.entries(records).forEach(([dateKey, r]: [string, any]) => {
                if (new Date(dateKey) > today) return;
                const st = r?.status || '';
                if (st === 'present') present += 1;
                if (st === 'late') late += 1;
                if (st === 'absent') absent += 1;
                if (st === 'on-leave' || st === 'leave') leave += 1;
                if (st === 'half-day') halfDay += 1;
            });
        });
        const marked = present + absent + late + leave + halfDay;
        const attendanceRate = marked > 0 ? ((present + late + halfDay * 0.5) / marked) * 100 : 0;
        return { present, absent, late, leave, halfDay, attendanceRate, headcount: filteredEmployees.length };
    }, [filteredEmployees, attendanceMap]);

    const clearFilters = () => {
        setSearchQuery('');
        setFilterDepartment('');
        setFilterPosition('');
        setFilterEmpStatus('active');
        setFilterAttStatus('');
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
                            <button
                                onClick={() => setShowFilters((v) => !v)}
                                className={`flex items-center gap-2 px-3 py-2 border rounded-md text-[10px] font-black uppercase tracking-widest transition-colors ${
                                    showFilters || activeFilterCount > 0
                                        ? 'bg-primary-50 border-primary-200 text-primary-700'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Filter size={14} />
                                <span>Filter</span>
                                {activeFilterCount > 0 && (
                                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary-600 text-white text-[9px] flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    try {
                                        const monthLabel = new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                        const dayHeaders = days.map((d) => d.getDate());
                                        const header = ['Employee', 'Employee ID', 'Department', ...dayHeaders.map(String), 'Paid Days'];
                                        const rows = filteredEmployees.map((emp) => {
                                            const empRecord = attendanceMap[emp.id] || {};
                                            const today = new Date();
                                            today.setHours(23, 59, 59, 999);
                                            let paid = 0;
                                            const dayCells = days.map((day) => {
                                                const dateKey = formatDate(day);
                                                let status = empRecord[dateKey]?.status || '';
                                                if (!status) {
                                                    const isHoliday = holidays.find((h: any) => formatDate(new Date(h.date)) === dateKey);
                                                    if (isHoliday) status = 'holiday';
                                                    else if (isOffDay(day)) status = 'weekend';
                                                }
                                                const code =
                                                    status === 'present' || status === 'late' ? (status === 'late' ? 'L' : 'P') :
                                                    status === 'absent' ? 'A' :
                                                    status === 'on-leave' || status === 'leave' ? 'OL' :
                                                    status === 'holiday' ? 'H' :
                                                    status === 'half-day' ? 'HD' :
                                                    status === 'weekend' ? 'OFF' : '-';
                                                if (day <= today) {
                                                    if (status === 'present' || status === 'late') paid += 1;
                                                    if (status === 'holiday' || status === 'weekend') paid += 1;
                                                    if (status === 'on-leave' || status === 'leave') paid += (empRecord[dateKey] as any)?.isPaid === false ? 0 : 1;
                                                    if (status === 'half-day') paid += 0.5;
                                                }
                                                return code;
                                            });
                                            return [
                                                `${emp.firstName} ${emp.lastName}`,
                                                emp.employeeId,
                                                emp.department?.name || '',
                                                ...dayCells,
                                                String(paid),
                                            ];
                                        });
                                        const csv = [header, ...rows]
                                            .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
                                            .join('\n');
                                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `attendance-register-${monthLabel.replace(/\s+/g, '-').toLowerCase()}.csv`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                        toast.success('Muster roll exported');
                                    } catch {
                                        toast.error('Export failed');
                                    }
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-[10px] font-black uppercase tracking-widest shadow-sm"
                            >
                                <Download size={14} />
                                <span>Export</span>
                            </button>
                        </div>
                    </div>
                }
            />

            {showFilters && (
                <div className="mb-4 bg-white border border-slate-200 rounded-md shadow-sm p-3 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                        <div className="md:col-span-2 xl:col-span-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Employee Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or employee ID..."
                                    className="ent-input w-full pl-9 pr-8 py-2 text-sm"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Department</label>
                            <CustomSelect
                                options={[
                                    { value: '', label: 'All Departments' },
                                    ...departments.map((d) => ({ value: d.id, label: d.name })),
                                ]}
                                value={filterDepartment}
                                onChange={setFilterDepartment}
                                placeholder="All Departments"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Position</label>
                            <CustomSelect
                                options={[
                                    { value: '', label: 'All Positions' },
                                    ...positions.map((p) => ({ value: p.id, label: p.title })),
                                ]}
                                value={filterPosition}
                                onChange={setFilterPosition}
                                placeholder="All Positions"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Employment Status</label>
                            <CustomSelect
                                options={[
                                    { value: '', label: 'All Statuses' },
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' },
                                    { value: 'terminated', label: 'Terminated' },
                                    { value: 'resigned', label: 'Resigned' },
                                ]}
                                value={filterEmpStatus}
                                onChange={setFilterEmpStatus}
                                placeholder="Employment Status"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Attendance (Month)</label>
                            <CustomSelect
                                options={[
                                    { value: '', label: 'Any Status' },
                                    { value: 'present', label: 'Has Present' },
                                    { value: 'late', label: 'Has Late' },
                                    { value: 'absent', label: 'Has Absent' },
                                    { value: 'on-leave', label: 'Has Leave' },
                                    { value: 'half-day', label: 'Has Half Day' },
                                    { value: 'present-on-leave', label: 'Present on Leave' },
                                ]}
                                value={filterAttStatus}
                                onChange={setFilterAttStatus}
                                placeholder="Any Status"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Showing <span className="text-slate-900">{filteredEmployees.length}</span> of {employees.length} employees
                        </p>
                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-800 flex items-center gap-1"
                            >
                                <X size={12} />
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
                {[
                    { label: 'Headcount', value: String(monthSummary.headcount), tone: 'border-t-primary-600' },
                    { label: 'Attendance Rate', value: `${monthSummary.attendanceRate.toFixed(1)}%`, tone: 'border-t-emerald-500' },
                    { label: 'Present Days', value: String(monthSummary.present), tone: 'border-t-green-500' },
                    { label: 'Late Marks', value: String(monthSummary.late), tone: 'border-t-orange-500' },
                    { label: 'Absences', value: String(monthSummary.absent), tone: 'border-t-rose-500' },
                    { label: 'Leave Days', value: String(monthSummary.leave + monthSummary.halfDay * 0.5), tone: 'border-t-sky-500' },
                ].map((kpi) => (
                    <div key={kpi.label} className={`ent-card p-3 border-t-4 ${kpi.tone}`}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
                        <p className="text-lg font-black text-slate-900 mt-0.5">{kpi.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-4 mb-4 px-1">
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-green-100 text-green-700 flex items-center justify-center font-bold mr-2">P</span> Present</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-orange-100 text-orange-700 flex items-center justify-center font-bold mr-2">L</span> Late</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-red-100 text-red-700 flex items-center justify-center font-bold mr-2">A</span> Absent</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold mr-2">OL</span> On Leave</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold mr-2">H</span> Holiday</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold mr-2">HD</span> Half Day / Half Day Leave</div>
                <div className="flex items-center text-xs text-gray-600"><span className="w-5 h-5 rounded-md bg-violet-100 text-violet-700 flex items-center justify-center font-bold mr-2 ring-2 ring-violet-300">P</span> Present on Leave</div>
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
                        ) : filteredEmployees.length === 0 ? (
                            <tr>
                                <td colSpan={days.length + 2} className="px-6 py-16 text-center">
                                    <p className="text-sm font-bold text-slate-700">No employees match your filters</p>
                                    <p className="text-xs text-slate-400 mt-1">Try adjusting search, department, or attendance status.</p>
                                    {activeFilterCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary-600 hover:underline"
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ) : filteredEmployees.map(emp => {
                            const empRecord = attendanceMap[emp.id] || {};
                            const today = new Date();
                            today.setHours(23, 59, 59, 999);

                            const stats = Object.entries(empRecord).reduce((acc, [dateKey, r]) => {
                                const date = new Date(dateKey);
                                if (date > today) return acc; // Don't count future days

                                if (r.status === 'present' || r.status === 'late') acc.present++;
                                if (r.status === 'absent') acc.absent++;
                                if (r.status === 'on-leave' || r.status === 'leave') {
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
                                                    {getStatusIcon(status, day, () => handleCellClick(emp.id, dateKey, status, record), record)}
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
                                { label: 'Late', value: 'late' },
                                { label: 'On Leave (Paid)', value: 'leave' },
                                { label: 'On Leave (Unpaid)', value: 'on-leave' }
                            ]}
                            value={manualData.status}
                            onChange={(val) => setManualData({ ...manualData, status: val })}
                        />
                    </div>

                    {manualData.leaveType && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs">
                            <span className="font-bold text-blue-700 uppercase tracking-wider">Leave Info:</span>
                            <span className="text-blue-600 ml-2">{manualData.leaveType}</span>
                            {manualData.durationType === 'half' || manualData.durationType === 'first_half' ? (
                                <span className="ml-2 text-yellow-600 font-bold">(Half Day - First Half)</span>
                            ) : manualData.durationType === 'second_half' ? (
                                <span className="ml-2 text-yellow-600 font-bold">(Half Day - Second Half)</span>
                            ) : null}
                            {manualData.isPaid === false && (
                                <span className="ml-2 text-red-600 font-bold">(Unpaid)</span>
                            )}
                        </div>
                    )}

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
