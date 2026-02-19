'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEffect, useState } from 'react';
import { attendanceApi, holidaysApi } from '@/lib/api/attendance';
import api from '@/lib/api';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Filter,
    Info,
    RefreshCw,
    Save,
    Search,
    Trash2,
    Calendar,
    Users,
    CheckCircle2,
    XCircle,
    LayoutGrid,
    MoreVertical,
    Zap,
    AlertCircle
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useConfirm } from '@/context/ConfirmationContext';

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    department?: { name: string };
    employeeId: string;
}

export default function AttendanceRegisterPage() {
    const toast = useToast();
    const { confirm } = useConfirm();
    const { can, user } = usePermission();

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [matrix, setMatrix] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [offDays, setOffDays] = useState<string[]>([]);
    const [daysInMonth, setDaysInMonth] = useState(31);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState('all');

    // Bulk Mark State
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkStart, setBulkStart] = useState('');
    const [bulkEnd, setBulkEnd] = useState('');
    const [bulkStatus, setBulkStatus] = useState('present');
    const [bulkCheckIn, setBulkCheckIn] = useState('09:00');
    const [bulkCheckOut, setBulkCheckOut] = useState('18:00');
    const [skipOffDays, setSkipOffDays] = useState(true);

    // Local changes to be saved
    const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});

    useEffect(() => {
        loadBaseData();
    }, []);

    useEffect(() => {
        loadRegister();
    }, [month, year, selectedDept]);

    const loadBaseData = async () => {
        try {
            const [deptRes] = await Promise.all([
                api.get('/departments')
            ]);
            setDepartments(deptRes.data);
        } catch (error) {
            console.error('Failed to load departments');
        }
    };

    const loadRegister = async () => {
        try {
            setLoading(true);
            const data = await attendanceApi.getMusterRoll(month, year, selectedDept);
            setMatrix(data.matrix);
            setDaysInMonth(data.meta.daysInMonth);
            if (data.meta.offDays) {
                setOffDays(data.meta.offDays.split(',').map((s: string) => s.trim()));
            }
            setPendingChanges({});
        } catch (error) {
            console.error('Failed to load register:', error);
            toast.error('Sync failed: Could not fetch matrix');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (employeeId: string, day: number, status: string | null) => {
        const key = `${employeeId}-${day}`;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (status === null) {
            // Mark for deletion
            setPendingChanges(prev => ({
                ...prev,
                [key]: { employeeId, date: dateStr, delete: true }
            }));
            return;
        }

        setPendingChanges(prev => ({
            ...prev,
            [key]: { employeeId, date: dateStr, status }
        }));
    };

    const handleSave = async () => {
        const changes = Object.values(pendingChanges);
        if (changes.length === 0) return;

        try {
            setSaving(true);

            // Separate deletes and marks
            const toDelete = changes.filter(c => c.delete);
            const toUpdate = changes.filter(c => !c.delete);

            const promises = [];
            if (toDelete.length > 0) {
                promises.push(...toDelete.map(d => attendanceApi.deleteRecord(d.employeeId, d.date)));
            }
            if (toUpdate.length > 0) {
                promises.push(attendanceApi.manualMark(toUpdate));
            }

            await Promise.all(promises);
            toast.success('Registry synchronized successfully');
            loadRegister();
        } catch (error: any) {
            console.error('Save failed:', error);
            toast.error(error.response?.data?.error || 'Failed to sync registry');
        } finally {
            setSaving(false);
        }
    };

    const handleBulkMark = () => {
        if (!bulkStart || !bulkEnd) {
            toast.error('Please select both Start and End dates');
            return;
        }

        const start = new Date(bulkStart);
        const end = new Date(bulkEnd);

        if (start > end) {
            toast.error('End date must be after start date');
            return;
        }

        const newChanges = { ...pendingChanges };
        let count = 0;

        // Apply to all filtered employees
        matrix.filter(row =>
            `${row.employee.firstName} ${row.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
        ).forEach(emp => {
            let current = new Date(start);
            while (current <= end) {
                if (current.getMonth() + 1 !== month || current.getFullYear() !== year) {
                    current.setDate(current.getDate() + 1);
                    continue;
                }

                const day = current.getDate();
                const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
                const isOff = offDays.includes(dayName);

                if (skipOffDays && isOff) {
                    current.setDate(current.getDate() + 1);
                    continue;
                }

                const key = `${emp.employee.id}-${day}`;
                const dateStr = current.toISOString().split('T')[0];

                const checkInISO = bulkCheckIn ? `${dateStr}T${bulkCheckIn}:00` : null;
                const checkOutISO = bulkCheckOut ? `${dateStr}T${bulkCheckOut}:00` : null;

                newChanges[key] = {
                    employeeId: emp.employee.id,
                    date: dateStr,
                    status: bulkStatus,
                    checkIn: checkInISO,
                    checkOut: checkOutISO
                };
                count++;

                current.setDate(current.getDate() + 1);
            }
        });

        setPendingChanges(newChanges);
        setShowBulkModal(false);
        toast.info(`Staged ${count} entries. Press 'Commit' to save.`);
    };

    const isOffDay = (day: number) => {
        const date = new Date(year, month - 1, day);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        return offDays.includes(dayName);
    };

    const renderCell = (row: any, day: number) => {
        const key = `${row.employee.id}-${day}`;
        const pending = pendingChanges[key];
        const record = pending || row.attendance[day];

        if (pending?.delete) {
            return (
                <div className="w-full h-8 flex items-center justify-center relative group">
                    <button
                        onClick={() => handleStatusChange(row.employee.id, day, 'present')}
                        className="text-[9px] font-black text-rose-500 bg-rose-50 border border-rose-100 rounded px-1.5 py-1 tracking-tighter uppercase"
                    >
                        PENDING DELETE
                    </button>
                </div>
            );
        }

        const status = record?.status;
        const isSet = !!status && status !== 'holiday' && status !== 'leave';
        const isOff = isOffDay(day);

        const getCellStyles = () => {
            if (status === 'present') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
            if (status === 'absent') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
            if (status === 'holiday') return 'bg-teal-50 text-teal-700 border-teal-100 font-bold';
            if (status === 'leave') return 'bg-blue-50 text-blue-700 border-blue-100 font-bold';
            if (status === 'late') return 'bg-amber-50 text-amber-700 border-amber-100 font-black';
            if (status === 'half-day') return 'bg-orange-50 text-orange-700 border-orange-100 font-black';
            if (isOff) return 'bg-slate-50 text-slate-400 border-slate-200';
            return 'bg-white text-slate-300 border-slate-100';
        };

        return (
            <div className="group relative w-full h-8">
                <CustomSelect
                    value={status || ''}
                    onChange={(val) => handleStatusChange(row.employee.id, day, val)}
                    options={[
                        { label: 'PRES', value: 'present' },
                        { label: 'ABS', value: 'absent' },
                        { label: 'LATE', value: 'late' },
                        { label: 'HALF', value: 'half-day' }
                    ]}
                    className={`w-full min-w-[70px] text-[10px] h-8 ${getCellStyles()}`}
                    placeholder={isOff ? 'W/OFF' : 'ABS'}
                    portal={true}
                    disabled={status === 'holiday' || status === 'leave'}
                />

                {status && status !== 'holiday' && status !== 'leave' && (
                    <button
                        onClick={async () => {
                            if (pending) {
                                const newPending = { ...pendingChanges };
                                delete newPending[key];
                                setPendingChanges(newPending);
                            } else {
                                handleStatusChange(row.employee.id, day, null);
                            }
                        }}
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-rose-600 text-white rounded-full p-0.5 shadow-md z-50 transition-all hover:scale-110"
                    >
                        <Trash2 size={8} />
                    </button>
                )}
            </div>
        );
    };

    if (user && !can('Attendance', 'read')) return <AccessDenied />;
    if (loading && matrix.length === 0) return <LoadingSpinner />;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const filteredMatrix = matrix.filter(row =>
        `${row.employee.firstName} ${row.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-4 h-[calc(100vh-100px)] animate-fade-in relative">

            {/* Action Bar */}
            <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary-900 rounded-md shadow-lg shadow-primary-900/20">
                            <CalendarDays className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 leading-none uppercase tracking-tight">Muster Roll</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Personnel Registry Matrix</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-md border border-slate-200">
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none py-1 px-2 cursor-pointer"
                        >
                            {monthNames.map((m, i) => <option key={m} value={i + 1}>{m.toUpperCase()}</option>)}
                        </select>
                        <div className="h-4 w-px bg-slate-300"></div>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="bg-transparent w-16 text-[11px] font-black outline-none px-2"
                        />
                    </div>

                    <div className="hidden lg:flex items-center gap-2">
                        <Users size={14} className="text-slate-400" />
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="text-[11px] font-bold text-slate-800 bg-white border border-slate-200 rounded px-3 py-1.5 outline-none hover:border-primary-500 transition-all uppercase"
                        >
                            <option value="all">Global Workforce</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="FIND RESOURCE..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 text-[11px] font-black text-gray-900 border border-gray-200 rounded-md focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none w-48 transition-all uppercase tracking-wide bg-gray-50/50"
                        />
                    </div>

                    <div className="h-8 w-px bg-gray-200 mx-1"></div>

                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-2 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
                    >
                        <Zap size={13} className="text-primary-600" />
                        <span>Bulk Mark</span>
                    </button>

                    <PermissionGuard module="Attendance" action="update">
                        <div className="flex items-center gap-2">
                            {Object.keys(pendingChanges).length > 0 && (
                                <button
                                    onClick={() => setPendingChanges({})}
                                    className="text-[10px] font-black text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-md tracking-widest uppercase transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving || Object.keys(pendingChanges).length === 0}
                                className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-md text-[10px] font-black uppercase tracking-tighter hover:bg-primary-700 disabled:opacity-50 disabled:grayscale shadow-lg shadow-primary-900/20 transition-all active:scale-95"
                            >
                                {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                                <span>{saving ? 'SYNCING...' : `COMMIT (${Object.keys(pendingChanges).length})`}</span>
                            </button>
                        </div>
                    </PermissionGuard>
                </div>
            </div>

            {/* Matrix View */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-grow relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-[60] flex flex-col items-center justify-center gap-4">
                        <LoadingSpinner />
                        <span className="font-black text-[10px] text-primary-900 tracking-[0.3em] uppercase animate-pulse">Reconstituting Personnel Matrix...</span>
                    </div>
                )}

                <div className="overflow-auto h-full scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    <table className="w-full border-separate border-spacing-0">
                        <thead className="sticky top-0 z-40">
                            <tr className="bg-white">
                                <th className="p-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] sticky left-0 bg-white border-b border-r border-slate-100 z-50 w-64 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                    Resource Lifecycle
                                </th>
                                <th className="p-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] sticky left-64 bg-white border-b border-r border-slate-100 z-50 w-32 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                    Protocol Stats
                                </th>
                                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                    const isOff = isOffDay(day);
                                    const date = new Date(year, month - 1, day);
                                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                                    return (
                                        <th key={day} className={`p-1 border-b border-r border-slate-100 last:border-r-0 min-w-[36px] ${isOff ? 'bg-slate-50 shadow-inner' : ''}`}>
                                            <div className="flex flex-col items-center py-1">
                                                <span className={`text-[8px] font-black uppercase tracking-tighter leading-none ${isOff ? 'text-rose-500' : 'text-slate-400'}`}>
                                                    {dayName}
                                                </span>
                                                <span className="text-xs font-black text-slate-900 mt-0.5">
                                                    {day}
                                                </span>
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredMatrix.map(row => (
                                <tr key={row.employee.id} className="hover:bg-primary-50/20 transition-colors group">
                                    <td className="p-2.5 whitespace-nowrap sticky left-0 bg-white group-hover:bg-primary-50/20 z-30 border-r border-slate-100 shadow-[2px_0_10px_rgba(0,0,0,0.03)]">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-primary-950 flex items-center justify-center text-white text-[10px] font-black shadow-lg ring-1 ring-white/10 shrink-0">
                                                {row.employee.firstName[0]}{row.employee.lastName[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[11px] font-black text-slate-900 truncate leading-tight uppercase tracking-tight group-hover:text-primary-700 transition-colors">
                                                    {row.employee.firstName} {row.employee.lastName}
                                                </div>
                                                <div className="text-[8px] font-black text-slate-400 flex items-center gap-2 mt-0.5">
                                                    <span className="bg-slate-100 px-1 rounded uppercase">{row.employee.employeeId}</span>
                                                    <span className="truncate max-w-[60px]">{row.employee.department?.name || 'CORE'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-2 whitespace-nowrap sticky left-64 bg-white group-hover:bg-primary-50/20 z-30 border-r border-slate-100 shadow-[2px_0_10px_rgba(0,0,0,0.03)]">
                                        {(() => {
                                            const today = new Date();
                                            today.setHours(23, 59, 59, 999);

                                            const stats = Object.entries(row.attendance).reduce((acc: any, [day, r]: [string, any]) => {
                                                const date = new Date(year, month - 1, parseInt(day));
                                                if (date > today) return acc;

                                                if (r.status === 'present' || r.status === 'late') acc.present++;
                                                if (r.status === 'holiday') acc.holiday++;
                                                if (r.status === 'leave') {
                                                    if (r.isPaid) acc.paidLeave++;
                                                    else acc.unpaidLeave++;
                                                }
                                                if (r.status === 'half-day') acc.halfDay++;
                                                return acc;
                                            }, { present: 0, holiday: 0, paidLeave: 0, unpaidLeave: 0, halfDay: 0, weekend: 0 });

                                            // Count weekeds independently since they might not be in the matrix attendance map
                                            for (let d = 1; d <= daysInMonth; d++) {
                                                const date = new Date(year, month - 1, d);
                                                if (date > today) break;
                                                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                                                if (offDays.includes(dayName) && !row.attendance[d]) {
                                                    stats.weekend++;
                                                }
                                            }

                                            const totalPaid = stats.present + stats.holiday + stats.weekend + stats.paidLeave + (stats.halfDay * 0.5);

                                            return (
                                                <div className="flex flex-col items-center">
                                                    <div className="text-[11px] font-black text-primary-700 leading-none">{totalPaid} <span className="text-[8px] text-slate-400">DAYS</span></div>
                                                    <div className="flex gap-1 mt-1">
                                                        <span title="Present" className="text-[7px] font-bold bg-emerald-50 text-emerald-600 px-1 rounded">P:{stats.present}</span>
                                                        <span title="Off/Holiday" className="text-[7px] font-bold bg-purple-50 text-purple-600 px-1 rounded">O:{stats.weekend + stats.holiday}</span>
                                                        <span title="Paid Leave" className="text-[7px] font-bold bg-blue-50 text-blue-600 px-1 rounded">L:{stats.paidLeave}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                                        <td key={day} className={`p-1 border-r border-slate-50 last:border-r-0 ${isOffDay(day) ? 'bg-slate-50/30' : ''}`}>
                                            {renderCell(row, day)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
                    <Info className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Protocol Glossary</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 text-emerald-700">PRESENT</div>
                    <div className="flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded border border-rose-100 text-rose-700">ABSENT</div>
                    <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded border border-amber-100 text-amber-700">LATE</div>
                    <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded border border-orange-100 text-orange-700">HALF-DAY</div>
                    <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded border border-blue-100 text-blue-700">LEAVE</div>
                    <div className="flex items-center gap-1.5 bg-teal-50 px-2 py-1 rounded border border-teal-100 text-teal-700">HOLIDAY</div>
                    <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-500">WEEKLY OFF</div>
                </div>
            </div>

            {/* Bulk Mark Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm" onClick={() => setShowBulkModal(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in duration-200">
                        <div className="bg-primary-900 p-4 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Zap size={18} fill="white" />
                                <h3 className="font-black uppercase text-sm tracking-widest">Smart Bulk Marker</h3>
                            </div>
                            <button onClick={() => setShowBulkModal(false)} className="hover:bg-white/10 p-1 rounded transition-colors">
                                <XCircle size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">
                                    Changes will apply to the currently filtered list of resources.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Start Protocol</label>
                                    <input
                                        type="date"
                                        value={bulkStart}
                                        onChange={(e) => setBulkStart(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Termination Protocol</label>
                                    <input
                                        type="date"
                                        value={bulkEnd}
                                        onChange={(e) => setBulkEnd(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase">Status Assignment</label>
                                <select
                                    value={bulkStatus}
                                    onChange={(e) => setBulkStatus(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500 uppercase"
                                >
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                    <option value="half-day">Half-Day</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Check-In Time</label>
                                    <input
                                        type="time"
                                        value={bulkCheckIn}
                                        onChange={(e) => setBulkCheckIn(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Check-Out Time</label>
                                    <input
                                        type="time"
                                        value={bulkCheckOut}
                                        onChange={(e) => setBulkCheckOut(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <input
                                    type="checkbox"
                                    id="skipOffDays"
                                    checked={skipOffDays}
                                    onChange={(e) => setSkipOffDays(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600 transition-all cursor-pointer"
                                />
                                <label htmlFor="skipOffDays" className="text-[10px] font-black text-slate-700 uppercase cursor-pointer select-none">
                                    Skip Company Off-Days (Recommended)
                                </label>
                            </div>

                            <button
                                onClick={handleBulkMark}
                                className="w-full bg-primary-600 text-white py-3 rounded-lg font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary-900/20 hover:bg-primary-700 transition-all active:scale-[0.98]"
                            >
                                Stage Batch Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
