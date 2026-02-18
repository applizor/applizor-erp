'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { holidaysApi, Holiday } from '@/lib/api/attendance';
import {
    ChevronLeft,
    ChevronRight,
    Save,
    Copy,
    Check,
    Clock,
    Calendar,
    Users,
    Search,
    Filter,
    Info,
    CalendarDays,
    RefreshCw,
    X
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { usePermission } from '@/hooks/usePermission';
// import { RosterGrid } from './components/RosterGrid';
import { useConfirm } from '@/context/ConfirmationContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import AccessDenied from '@/components/AccessDenied';

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    department?: { name: string };
    employeeId: string;
}

interface Shift {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    color?: string;
}

const getShiftColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('morning') || n.includes('general')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (n.includes('evening') || n.includes('afternoon')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (n.includes('night')) return 'bg-primary-50 text-primary-700 border-primary-100';
    return 'bg-slate-50 text-slate-700 border-slate-200';
};

export default function RosterPage() {
    const toast = useToast();
    const { can, user } = usePermission();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [roster, setRoster] = useState<Record<string, any>>({});
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [offDays, setOffDays] = useState<string[]>([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadRoster();
    }, [currentWeek]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [empRes, shiftRes, companyRes] = await Promise.all([
                api.get('/employees'),
                api.get('/shifts'),
                api.get('/company')
            ]);
            setEmployees(empRes.data);
            setShifts(shiftRes.data);
            if (companyRes.data?.company?.offDays) {
                setOffDays(companyRes.data.company.offDays.split(',').map((s: string) => s.trim()));
            }
        } catch (error) {
            console.error('Failed to load initial data:', error);
            toast.error('Failed to load employee/shift data');
        } finally {
            setLoading(false);
        }
    };

    const loadRoster = async () => {
        try {
            const startOfWeek = getStartOfWeek(currentWeek);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);

            const rosterRes = await api.get('/shift-rosters', {
                params: {
                    startDate: startOfWeek.toISOString().split('T')[0],
                    endDate: endOfWeek.toISOString().split('T')[0]
                }
            });

            const holidaysRes = await holidaysApi.getAll(currentWeek.getFullYear());
            setHolidays(holidaysRes);

            const rosterMap: Record<string, any> = {};
            rosterRes.data.forEach((entry: any) => {
                const dateKey = entry.date.split('T')[0];
                const key = `${entry.employeeId}-${dateKey}`;

                if (entry.isLeave) {
                    rosterMap[key] = {
                        type: 'leave',
                        name: entry.shift.name,
                        shiftId: 'LEAVE',
                        leaveType: entry.shift.name.replace('Leave: ', '')
                    };
                } else {
                    rosterMap[key] = {
                        type: 'shift',
                        shiftId: entry.shiftId
                    };
                }
            });
            setRoster(rosterMap);
        } catch (error) {
            console.error('Failed to load roster:', error);
            toast.error('Failed to sync roster data');
        }
    };

    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const getWeekDays = () => {
        const start = getStartOfWeek(currentWeek);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    };

    const handleShiftChange = (employeeId: string, date: Date, shiftId: string) => {
        const dateKey = date.toISOString().split('T')[0];
        setRoster(prev => ({
            ...prev,
            [`${employeeId}-${dateKey}`]: { type: 'shift', shiftId }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const assignments = Object.entries(roster)
                .filter(([_, val]: [string, any]) => val.type === 'shift')
                .map(([key, val]: [string, any]) => {
                    const date = key.slice(-10);
                    const employeeId = key.slice(0, -11);
                    return { employeeId, date, shiftId: val.shiftId };
                });

            await api.post('/shift-rosters/batch', { assignments });
            toast.success('Roster published successfully');
            loadRoster();
        } catch (error: any) {
            console.error('Failed to save roster:', error);
            toast.error(error.response?.data?.error || 'Failed to save roster');
        } finally {
            setSaving(false);
        }
    };

    const { confirm } = useConfirm();

    const handleCopyPreviousWeek = async () => {
        if (!await confirm({ message: 'Override current selections with previous week configuration?', type: 'warning' })) return;

        try {
            setSaving(true);
            const startOfWeek = getStartOfWeek(currentWeek);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);

            const res = await api.post('/shift-rosters/sync-prev', {
                currentStartDate: startOfWeek.toISOString().split('T')[0],
                currentEndDate: endOfWeek.toISOString().split('T')[0]
            });

            if (res.data.success) {
                toast.success(`Successfully synced ${res.data.syncedCount} assignments.`);
                if (res.data.conflicts?.length > 0) {
                    toast.warning(`${res.data.conflicts.length} conflicts skipped due to leaves.`);
                }
                loadRoster();
            } else {
                toast.info(res.data.message || 'No data to sync');
            }
        } catch (error: any) {
            console.error('Sync error:', error);
            toast.error(error.response?.data?.error || 'Failed to sync with previous week');
        } finally {
            setSaving(false);
        }
    };

    if (user && !can('ShiftRoster', 'read')) {
        return <AccessDenied />;
    }

    const isOffDay = (date: Date) => {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        return offDays.includes(dayName);
    };

    const weekDays = getWeekDays();
    const filteredEmployees = employees.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="flex flex-col gap-4 h-[calc(100vh-100px)]">
            <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 leading-none">
                            <CalendarDays className="w-5 h-5 text-primary-600" />
                            Weekly Shift Roster
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Workforce Scheduling Ledger</p>
                    </div>

                    <div className="flex items-center bg-gray-50 rounded border border-gray-200 overflow-hidden shadow-inner">
                        <button
                            onClick={() => {
                                const d = new Date(currentWeek);
                                d.setDate(d.getDate() - 7);
                                setCurrentWeek(d);
                            }}
                            className="p-1 px-2 hover:bg-white transition-colors border-r border-gray-200 text-gray-500"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="px-3 py-1 text-xs font-black text-slate-700 min-w-[160px] text-center">
                            {weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <button
                            onClick={() => {
                                const d = new Date(currentWeek);
                                d.setDate(d.getDate() + 7);
                                setCurrentWeek(d);
                            }}
                            className="p-1 px-2 hover:bg-white transition-colors border-l border-gray-200 text-gray-500"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find member..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-xs text-gray-900 border border-gray-200 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none w-48 shadow-sm transition-all"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    {(can('ShiftRoster', 'create') || can('ShiftRoster', 'update')) && (
                        <button
                            onClick={handleCopyPreviousWeek}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-[11px] font-bold hover:bg-gray-50 shadow-sm transition-all active:scale-95"
                        >
                            <Copy size={13} />
                            <span>SYNC PREV</span>
                        </button>
                    )}

                    <PermissionGuard module="ShiftRoster" action="update">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-1.5 rounded text-[11px] font-bold hover:bg-primary-700 disabled:opacity-50 shadow-md transition-all active:scale-95 ml-1"
                        >
                            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                            <span>{saving ? 'PUBLISHING...' : 'PUBLISH ROSTER'}</span>
                        </button>
                    </PermissionGuard>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-grow relative">
                <div className="overflow-auto h-full scrollbar-thin scrollbar-thumb-gray-200">
                    <table className="w-full border-separate border-spacing-0">
                        <thead className="sticky top-0 z-30 shadow-sm">
                            <tr className="bg-gray-50/95 backdrop-blur-sm">
                                <th className="p-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest sticky left-0 bg-gray-50 z-40 border-b border-r border-gray-200 w-64">
                                    Member Lifecycle
                                </th>
                                {weekDays.map(day => {
                                    const isWeekend = isOffDay(day);
                                    const holiday = holidays.find(h => new Date(h.date).toDateString() === day.toDateString());
                                    return (
                                        <th key={day.toISOString()} className={`p-2 border-b border-r last:border-r-0 min-w-[120px] ${isWeekend ? 'bg-slate-50' : ''}`}>
                                            <div className="flex flex-col items-center">
                                                <span className={`text-[10px] font-black uppercase tracking-tighter ${isWeekend ? 'text-rose-600' : 'text-slate-500'}`}>
                                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                                </span>
                                                <span className="text-base font-black text-slate-800 leading-none mt-0.5">
                                                    {day.getDate()}
                                                </span>
                                                {holiday && (
                                                    <span className="mt-1 text-[8px] font-black bg-teal-50 text-teal-700 border border-teal-100 px-1.5 py-0.5 rounded-full truncate max-w-[100px]" title={holiday.name}>
                                                        HOLIDAY
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEmployees.map(emp => (
                                <tr key={emp.id} className="hover:bg-primary-50/30 transition-colors group">
                                    <td className="p-2 whitespace-nowrap sticky left-0 bg-white group-hover:bg-primary-50/30 z-20 border-r border-gray-200 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center text-white text-[10px] font-black shadow-sm flex-shrink-0">
                                                {emp.firstName[0]}{emp.lastName[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-slate-900 truncate leading-tight uppercase tracking-tight">
                                                    {emp.firstName} {emp.lastName}
                                                </div>
                                                <div className="text-[9px] font-bold text-gray-400 flex items-center gap-1.5 mt-0.5">
                                                    <span className="px-1 bg-gray-50 border border-gray-100 rounded">{emp.employeeId}</span>
                                                    <span className="truncate max-w-[80px]">{emp.department?.name || 'GEN'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {weekDays.map(day => {
                                        const dateKey = day.toISOString().split('T')[0];
                                        const entry = (roster as any)[`${emp.id}-${dateKey}`];
                                        const holiday = holidays.find(h => new Date(h.date).toDateString() === day.toDateString());

                                        const isLeave = entry?.type === 'leave';
                                        const shiftId = entry?.type === 'shift' ? entry.shiftId : '';
                                        const leaveName = entry?.leaveType || 'Leave';
                                        const selectedShift = shifts.find(s => s.id === shiftId);

                                        let displayContent = null;
                                        let cellStyle = 'bg-white border-transparent text-slate-400';

                                        if (isLeave) {
                                            cellStyle = 'bg-rose-50 border-rose-100 text-rose-700 font-bold';
                                            displayContent = (
                                                <div className="flex items-center justify-center gap-1">
                                                    <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></div>
                                                    {leaveName.split(' ')[0]}
                                                </div>
                                            );
                                        } else if (shiftId && selectedShift) {
                                            cellStyle = `${getShiftColor(selectedShift.name)} font-black`;
                                            displayContent = selectedShift.name.split(' ')[0].toUpperCase();
                                        } else if (holiday && !shiftId) {
                                            cellStyle = 'bg-teal-50 border-teal-100 text-teal-800 font-bold';
                                            displayContent = 'HOLIDAY';
                                        }

                                        return (
                                            <td key={dateKey} className="p-1 px-1.5 border-r last:border-r-0 border-gray-50">
                                                <div className="relative">
                                                    {(can('ShiftRoster', 'create') || can('ShiftRoster', 'update')) && !isLeave ? (
                                                        <CustomSelect
                                                            value={shiftId}
                                                            onChange={(val) => handleShiftChange(emp.id, day, val)}
                                                            options={[
                                                                { label: 'REST', value: '' },
                                                                ...shifts.map(s => ({ label: s.name, value: s.id }))
                                                            ]}
                                                            className={`w-full min-w-[100px] ${cellStyle}`}
                                                            placeholder="REST"
                                                            align="left"
                                                        />
                                                    ) : (
                                                        <div className={`w-full py-2.5 rounded border text-[10px] text-center select-none uppercase tracking-tighter ${cellStyle}`}>
                                                            {displayContent || (isOffDay(day) ? 'W/OFF' : 'OFF')}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-r border-gray-200 pr-4">Matrix Legends</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-blue-50 border border-blue-100 rounded-sm"></span>
                        <span className="text-slate-600">GENERAL/MORNING</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-amber-50 border border-amber-100 rounded-sm"></span>
                        <span className="text-slate-600">EVENING/AFTERNOON</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-primary-50 border border-primary-100 rounded-sm"></span>
                        <span className="text-slate-600">NIGHT OPERATIONS</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-rose-50 border border-rose-100 rounded-sm shadow-inner"></span>
                        <span className="text-rose-700">ACTIVE LEAVES</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-teal-50 border border-teal-100 rounded-sm"></span>
                        <span className="text-teal-700">PUBLIC HOLIDAYS</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
