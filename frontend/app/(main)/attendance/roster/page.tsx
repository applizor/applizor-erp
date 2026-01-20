'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { holidaysApi, Holiday } from '@/lib/api/attendance';
import { ChevronLeft, ChevronRight, Save, Copy, Check, Clock, Calendar } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
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
    color?: string; // Optional color property if we add it to backend later
}

// Visual color mapping for shifts based on name/time
const getShiftColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('morning') || n.includes('general')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (n.includes('evening') || n.includes('afternoon')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (n.includes('night')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
};

export default function RosterPage() {
    const toast = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [roster, setRoster] = useState<Record<string, any>>({}); // "employeeId-date": { type, shiftId, ... }
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const { can, user } = usePermission();

    // Page Level Security
    if (user && !can('ShiftRoster', 'read')) {
        return <AccessDenied />;
    }

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadRoster();
    }, [currentWeek]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [empRes, shiftRes] = await Promise.all([
                api.get('/employees'),
                api.get('/shifts')
            ]);
            setEmployees(empRes.data);
            setShifts(shiftRes.data);
        } catch (error) {
            console.error('Failed to load initial data:', error);
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

            // Fetch Holidays for the year (optimization: could filter by range backend side)
            const holidaysRes = await holidaysApi.getAll(currentWeek.getFullYear());
            setHolidays(holidaysRes);

            // The backend now returns a mixed array: ShiftRoster[] AND Leave Entries { isLeave: true, ... }
            const rosterMap: Record<string, any> = {};

            rosterRes.data.forEach((entry: any) => {
                const dateKey = entry.date.split('T')[0];
                const key = `${entry.employeeId}-${dateKey}`;

                if (entry.isLeave) {
                    rosterMap[key] = {
                        type: 'leave',
                        name: entry.shift.name,
                        shiftId: 'LEAVE', // Placeholder
                        leaveType: entry.shift.name.replace('Leave: ', '')
                    };
                } else {
                    rosterMap[key] = {
                        type: 'shift',
                        shiftId: entry.shiftId
                    };
                }
            });
            setRoster(rosterMap as any);
        } catch (error) {
            console.error('Failed to load roster:', error);
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
        // Don't allow changing if it's a Leave? Or allow override?
        // For now, allow override, but maybe warn.
        setRoster(prev => ({
            ...prev,
            [`${employeeId}-${dateKey}`]: { type: 'shift', shiftId }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // Only save actual shift changes, ignore leaves
            const assignments = Object.entries(roster)
                .filter(([_, val]: [string, any]) => val.type === 'shift')
                .map(([key, val]: [string, any]) => {
                    const date = key.slice(-10);
                    const employeeId = key.slice(0, -11);
                    return { employeeId, date, shiftId: val.shiftId };
                });

            await api.post('/shift-rosters/batch', { assignments });
            // Using Enterprise Toast instead of Alert? (Need to import context if available, else standard alert for now)
            toast.success('Roster saved successfully');
        } catch (error: any) {
            console.error('Failed to save roster:', error);
            const msg = error.response?.data?.error || 'Failed to save roster';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleCopyPreviousWeek = () => {
        if (!confirm('This will overwrite current week with previous week\'s shifts. Continue?')) return;
        toast.info('Feature coming soon: Copy from previous week template');
    };

    const weekDays = getWeekDays();

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-8 bg-gray-200 animate-pulse w-48 rounded"></div>
                <div className="grid grid-cols-8 gap-2">
                    {Array.from({ length: 64 }).map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 animate-pulse rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col bg-gray-50/50">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Shift Roster</h2>
                    <p className="text-sm text-gray-500">Weekly Shift Planner</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex bg-white rounded-md shadow-sm border border-gray-300">
                        <button
                            onClick={() => {
                                const d = new Date(currentWeek);
                                d.setDate(d.getDate() - 7);
                                setCurrentWeek(d);
                            }}
                            className="p-2 hover:bg-gray-50 border-r"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="px-4 py-2 text-sm font-medium w-48 text-center text-gray-700">
                            {weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <button
                            onClick={() => {
                                const d = new Date(currentWeek);
                                d.setDate(d.getDate() + 7);
                                setCurrentWeek(d);
                            }}
                            className="p-2 hover:bg-gray-50 border-l"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {(can('ShiftRoster', 'create') || can('ShiftRoster', 'update')) && (
                        <button
                            onClick={handleCopyPreviousWeek}
                            className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 shadow-sm"
                        >
                            <Copy size={16} />
                            <span>Copy Previous</span>
                        </button>
                    )}

                    <PermissionGuard module="ShiftRoster" action="update">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-colors"
                        >
                            {saving ? <Clock size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>{saving ? 'Saving...' : 'Save Roster'}</span>
                        </button>
                    </PermissionGuard>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-grow overflow-auto relative">
                <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
                    <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-20">
                        <tr>
                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-30 border-r border-b w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                Employee Details
                            </th>
                            {weekDays.map(day => (
                                <th key={day.toISOString()} className={`px-2 py-3 text-center border-b min-w-[140px] ${[0, 6].includes(day.getDay()) ? 'bg-red-50/30' : ''}`}>
                                    <div className={`text-sm font-bold ${[0, 6].includes(day.getDay()) ? 'text-red-600' : 'text-gray-800'}`}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                    <div className="text-xs text-gray-400 font-medium">{day.getDate()} {day.toLocaleDateString('en-US', { month: 'short' })}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {employees.map(emp => (
                            <tr key={emp.id} className="group hover:bg-indigo-50/10 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white group-hover:bg-indigo-50/10 z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)]">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-xs ring-2 ring-white shadow-sm">
                                            {emp.firstName[0]}{emp.lastName[0]}
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-bold text-gray-900">{emp.firstName} {emp.lastName}</div>
                                            <div className="text-xs text-gray-500 font-mono">{emp.employeeId}</div>
                                        </div>
                                    </div>
                                </td>
                                {weekDays.map(day => {
                                    const dateKey = day.toISOString().split('T')[0];
                                    const entry = (roster as any)[`${emp.id}-${dateKey}`];

                                    // Holiday Check
                                    const holiday = holidays.find(h => new Date(h.date).toDateString() === day.toDateString());
                                    const isHoliday = !!holiday;

                                    // Determine Display State
                                    let isLeave = entry?.type === 'leave';
                                    let shiftId = entry?.type === 'shift' ? entry.shiftId : '';
                                    let leaveName = entry?.leaveType || 'Leave';

                                    const selectedShift = shifts.find(s => s.id === shiftId);
                                    let colorClass = 'bg-white border-gray-200 text-gray-400';

                                    if (isLeave) {
                                        colorClass = 'bg-red-50 border-red-200 text-red-700 font-medium';
                                    } else if (shiftId && selectedShift) {
                                        colorClass = getShiftColor(selectedShift.name);
                                    } else if (isHoliday) {
                                        colorClass = 'bg-teal-50 border-teal-200 text-teal-800 font-medium';
                                    }

                                    return (
                                        <td key={dateKey} className="px-2 py-2 text-center border-b border-r border-gray-50 last:border-r-0">
                                            <div className="relative group/cell">
                                                {isLeave ? (
                                                    <div className={`w-full py-2 px-2 rounded-lg border text-xs flex items-center justify-center gap-1 ${colorClass}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                        {leaveName}
                                                    </div>
                                                ) : isHoliday && !shiftId ? (
                                                    <div className={`w-full py-2 px-2 rounded-lg border text-xs flex items-center justify-center gap-1 ${colorClass}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                                        {holiday?.name}
                                                    </div>
                                                ) : (
                                                    (can('ShiftRoster', 'create') || can('ShiftRoster', 'update')) ? (
                                                        // Editable dropdown for users with permissions
                                                        <div className="relative">
                                                            <select
                                                                value={shiftId}
                                                                onChange={(e) => handleShiftChange(emp.id, day, e.target.value)}
                                                                className={`block w-full text-xs rounded-lg border px-2 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer transition-all shadow-sm ${colorClass} font-medium text-center hover:border-indigo-300`}
                                                            >
                                                                <option value="">{isHoliday ? `${holiday?.name} (Holiday)` : 'Off (Rest)'}</option>
                                                                {shifts.map(s => (
                                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                                ))}
                                                            </select>
                                                            {!shiftId && !isHoliday && (
                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 text-[10px] font-bold tracking-wider">
                                                                    OFF
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        // Read-only display for users without permissions
                                                        <div className={`w-full py-2 px-2 rounded-lg border text-xs flex items-center justify-center ${colorClass} font-medium`}>
                                                            {selectedShift ? selectedShift.name : (isHoliday ? holiday?.name : 'Off')}
                                                        </div>
                                                    )
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

            {/* Legend Footer */}
            <div className="mt-4 flex items-center space-x-6 text-xs text-gray-600 border-t pt-4">
                <span className="font-semibold">Legend:</span>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></span>
                    <span>General/Morning</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></span>
                    <span>Evening/Afternoon</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-indigo-100 border border-indigo-200 rounded"></span>
                    <span>Night Shift</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></span>
                    <span>Off / Rest Day</span>
                </div>
            </div>
        </div>
    );
}
