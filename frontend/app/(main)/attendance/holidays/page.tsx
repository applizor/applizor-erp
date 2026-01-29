'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEffect, useState } from 'react';
import { holidaysApi, Holiday } from '@/lib/api/attendance';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ChevronLeft, ChevronRight, Plus, Calendar, Trash2, Globe, Briefcase, Building2, X } from 'lucide-react';
import { useConfirm } from '@/context/ConfirmationContext';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function HolidaysPage() {
    const toast = useToast();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        type: 'national'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await holidaysApi.getAll(new Date().getFullYear());
            setHolidays(data);
        } catch (error) {
            console.error('Failed to load holidays:', error);
            toast.error('Failed to load holidays');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await holidaysApi.create({
                ...formData,
                type: formData.type as 'national' | 'regional' | 'company'
            });
            setIsModalOpen(false);
            setFormData({ name: '', date: '', type: 'national' });
            loadData();
            toast.success('Holiday added successfully');
        } catch (error) {
            console.error('Failed to create holiday:', error);
            toast.error('Failed to add holiday');
        }
    };

    const { confirm } = useConfirm();

    const handleDelete = async (id: string) => {
        if (await confirm({ message: 'Are you sure you want to delete this holiday?', type: 'danger' })) {
            try {
                await holidaysApi.delete(id);
                loadData();
                toast.success('Holiday deleted');
            } catch (error) {
                console.error('Failed to delete:', error);
                toast.error('Failed to delete holiday');
            }
        }
    };

    const getHolidayIcon = (type: string) => {
        switch (type) {
            case 'national': return <Globe className="w-3.5 h-3.5" />;
            case 'regional': return <Briefcase className="w-3.5 h-3.5" />;
            case 'company': return <Building2 className="w-3.5 h-3.5" />;
            default: return <Calendar className="w-3.5 h-3.5" />;
        }
    };

    const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'single-month'>('list');
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Helper to generate calendar grid for a specific month
    const renderMonthCalendar = (monthIndex: number, year: number, isInteractive = true) => {
        const firstDay = new Date(year, monthIndex, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const monthName = new Date(year, monthIndex).toLocaleString('default', { month: 'long' });
        const hasHolidays = holidays.some(h => {
            const d = new Date(h.date);
            return d.getMonth() === monthIndex && d.getFullYear() === year;
        });

        const days = [];
        // Empty slots for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const holiday = holidays.find(h => h.date === dateStr);

            days.push(
                <div key={day} className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-bold relative group transition-all
                    ${holiday
                        ? (holiday.type === 'national' ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700'
                            : holiday.type === 'regional' ? 'bg-amber-500 text-white shadow-md shadow-amber-200 hover:bg-amber-600'
                                : 'bg-purple-600 text-white shadow-md shadow-purple-200 hover:bg-purple-700')
                        : 'text-slate-600 hover:bg-slate-100'}
                `}>
                    {day}
                    {holiday && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 w-max max-w-[180px]">
                            <div className="bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl border border-slate-700">
                                <p className="font-bold border-b border-slate-700 pb-1 mb-1">{holiday.name}</p>
                                <div className="flex justify-between gap-4 opacity-90">
                                    <span className="capitalize">{holiday.type}</span>
                                    <span>{new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                                </div>
                            </div>
                            <div className="w-2 h-2 bg-slate-900 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div
                key={monthName}
                onClick={() => {
                    if (isInteractive) {
                        setSelectedDate(new Date(year, monthIndex, 1));
                        setViewMode('single-month');
                    }
                }}
                className={`ent-card p-4 transition-all duration-300 ${isInteractive ? 'cursor-pointer hover:border-primary-300 hover:shadow-md' : 'border-primary-100 shadow-sm'} ${hasHolidays && isInteractive ? 'ring-1 ring-primary-50 bg-primary-50/10' : ''}`}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{monthName}</h3>
                    {hasHolidays && <div className="h-1.5 w-1.5 rounded-full bg-primary-500"></div>}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <span key={d} className="text-[9px] font-black text-slate-400">{d}</span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 place-items-center">
                    {days}
                </div>
            </div>
        );
    };

    const renderCalendarView = () => {
        const year = new Date().getFullYear();
        return (
            <div className="animate-fade-in">
                <div className="text-center mb-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select a month to view details</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => renderMonthCalendar(i, year))}
                </div>
            </div>
        );
    };

    const renderSingleMonthView = () => {
        const monthIndex = selectedDate.getMonth();
        const year = selectedDate.getFullYear();
        const monthName = selectedDate.toLocaleString('default', { month: 'long' });

        // Filter holidays for this month
        const monthHolidays = holidays.filter(h => {
            const d = new Date(h.date);
            return d.getMonth() === monthIndex && d.getFullYear() === year;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const changeMonth = (delta: number) => {
            const newDate = new Date(selectedDate);
            newDate.setMonth(newDate.getMonth() + delta);
            setSelectedDate(newDate);
        };

        return (
            <div className="animate-fade-in max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setViewMode('calendar')} className="text-xs font-bold text-slate-500 hover:text-primary-600 flex items-center gap-1 uppercase tracking-wider transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Back to Year View
                    </button>

                    <div className="flex items-center gap-6 bg-white px-6 py-2 rounded-full shadow-sm border border-slate-200">
                        <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-all">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-black text-slate-900 w-40 text-center select-none">
                            {monthName} <span className="text-slate-400 font-bold">{year}</span>
                        </h2>
                        <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="w-32"></div> {/* Spacer for centering */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {/* Render larger month calendar */}
                        <div className="ent-card p-8 bg-white shadow-xl shadow-primary-50/50">
                            {/* Custom Large Grid Logic inline or reuse */}
                            <div className="grid grid-cols-7 gap-4 text-center mb-6">
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                                    <span key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.slice(0, 3)}</span>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-4">
                                {(() => {
                                    const firstDay = new Date(year, monthIndex, 1).getDay();
                                    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                                    const grid = [];

                                    for (let i = 0; i < firstDay; i++) grid.push(<div key={`empty-${i}`} className="h-14 lg:h-20"></div>);

                                    for (let day = 1; day <= daysInMonth; day++) {
                                        const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        const holiday = holidays.find(h => h.date === dateStr);

                                        grid.push(
                                            <div key={day} className={`h-14 lg:h-20 border rounded-md flex flex-col items-center justify-start py-2 relative transition-all duration-300
                                                ${holiday
                                                    ? (holiday.type === 'national' ? 'bg-blue-50 border-blue-200'
                                                        : holiday.type === 'regional' ? 'bg-amber-50 border-amber-200'
                                                            : 'bg-purple-50 border-purple-200')
                                                    : 'bg-white border-transparent hover:border-slate-100 hover:shadow-sm'}
                                            `}>
                                                <span className={`text-sm font-black mb-1 ${holiday ? 'text-slate-900' : 'text-slate-400'}`}>{day}</span>
                                                {holiday && (
                                                    <div className={`w-1.5 h-1.5 rounded-full mt-1
                                                        ${holiday.type === 'national' ? 'bg-blue-500'
                                                            : holiday.type === 'regional' ? 'bg-amber-500'
                                                                : 'bg-purple-500'}
                                                    `}></div>
                                                )}
                                                {holiday && (
                                                    <span className="hidden lg:block text-[9px] font-bold text-center px-1 leading-tight text-slate-600 mt-1 line-clamp-2">{holiday.name}</span>
                                                )}
                                            </div>
                                        );
                                    }
                                    return grid;
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="ent-card p-6 h-full bg-slate-50/50 border-slate-200">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary-500" />
                                Events this Month
                            </h3>

                            {monthHolidays.length > 0 ? (
                                <div className="space-y-4">
                                    {monthHolidays.map(holiday => (
                                        <div key={holiday.id} className="bg-white p-4 rounded-md border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border
                                                    ${holiday.type === 'national' ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                        : holiday.type === 'regional' ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                            : 'bg-purple-50 text-purple-700 border-purple-100'}
                                                `}>
                                                    {holiday.type}
                                                </div>
                                                <span className="text-xs font-black text-slate-400">
                                                    {new Date(holiday.date).getDate()}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-primary-600 transition-colors">{holiday.name}</h4>
                                            <p className="text-xs text-slate-400 mt-1 font-medium italic">
                                                {new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'long' })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 opacity-50">
                                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Calendar className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">No events scheduled</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                        <Calendar className="w-6 h-6 text-primary-600" />
                        Holiday Calendar ({new Date().getFullYear()})
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Official company and public holiday ledger
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'list'
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'calendar'
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Calendar
                        </button>
                    </div>

                    <PermissionGuard module="Holiday" action="create">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Holiday
                        </button>
                    </PermissionGuard>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                    {holidays.map((holiday) => (
                        <div key={holiday.id} className="ent-card flex flex-col justify-between group hover:border-primary-300 transition-all p-4">
                            <div>
                                <div className="flex justify-between items-start">
                                    <span className={`ent-badge flex items-center gap-1.5 ${holiday.type === 'national' ? 'ent-badge-info' :
                                        holiday.type === 'regional' ? 'ent-badge-warning' :
                                            'ent-badge-neutral'
                                        }`}>
                                        {getHolidayIcon(holiday.type)}
                                        {holiday.type}
                                    </span>
                                    <PermissionGuard module="Holiday" action="delete">
                                        <button
                                            onClick={() => handleDelete(holiday.id)}
                                            title="Delete"
                                            className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-rose-50 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </PermissionGuard>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-sm font-black text-slate-900 truncate" title={holiday.name}>{holiday.name}</h3>
                                    <div className="mt-2 flex items-baseline gap-1 text-primary-600">
                                        <span className="text-3xl font-black tracking-tighter">
                                            {new Date(holiday.date).getDate()}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {new Date(holiday.date).toLocaleDateString(undefined, { month: 'long', weekday: 'short' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {holidays.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-slate-50 rounded-md border-2 border-dashed border-slate-200">
                            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No holidays scheduled for this cycle.</p>
                        </div>
                    )}
                </div>
            ) : viewMode === 'single-month' ? (
                renderSingleMonthView()
            ) : (
                renderCalendarView()
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
                        <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Add Holiday</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">New Calendar Registry</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="ent-form-group">
                                <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Holiday Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Independence Day"
                                    className="ent-input"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="ent-form-group">
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="ent-input"
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Type</label>
                                    <CustomSelect
                                        value={formData.type}
                                        onChange={(val) => setFormData({ ...formData, type: val })}
                                        options={[
                                            { label: 'National', value: 'national' },
                                            { label: 'Regional', value: 'regional' },
                                            { label: 'Company', value: 'company' }
                                        ]}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-primary-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-primary-700 shadow-md transition-all active:scale-95"
                                >
                                    Create Holiday
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
