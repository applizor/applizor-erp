'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useConfirm } from '@/context/ConfirmationContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import AccessDenied from '@/components/AccessDenied';
import { Plus, Trash2, Clock, Calendar, Users, Settings2, Activity, X, Edit2 } from 'lucide-react';

interface Shift {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    breakDuration: number;
    isActive: boolean;
    workDays: string[];
    _count?: {
        employees: number;
    };
}

export default function ShiftsPage() {
    const toast = useToast();
    const { can, user } = usePermission();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [currentShift, setCurrentShift] = useState<Partial<Shift>>({
        name: '',
        startTime: '09:00',
        endTime: '18:00',
        breakDuration: 60,
        isActive: true,
        workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    });

    const daysOfWeek = [
        { id: 'monday', label: 'Mon' },
        { id: 'tuesday', label: 'Tue' },
        { id: 'wednesday', label: 'Wed' },
        { id: 'thursday', label: 'Thu' },
        { id: 'friday', label: 'Fri' },
        { id: 'saturday', label: 'Sat' },
        { id: 'sunday', label: 'Sun' }
    ];

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadShifts();
    }, []);

    const loadShifts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/shifts');
            setShifts(response.data);
        } catch (error) {
            console.error('Failed to load shifts:', error);
            setError('Failed to load shifts. Please try refreshing.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (isEditing && currentShift.id) {
                await api.put(`/shifts/${currentShift.id}`, currentShift);
                toast.success('Shift updated successfully');
            } else {
                await api.post('/shifts', currentShift);
                toast.success('Shift created successfully');
            }
            setShowModal(false);
            resetForm();
            loadShifts();
        } catch (error: any) {
            console.error('Save error:', error);
            const msg = error.response?.data?.error || 'Failed to save shift';
            setError(msg);
            toast.error(msg);
        }
    };

    const { confirm } = useConfirm();

    const handleDelete = async (id: string) => {
        if (!await confirm({ message: 'Are you sure you want to delete this shift? This action cannot be undone.', type: 'danger' })) return;
        try {
            await api.delete(`/shifts/${id}`);
            loadShifts();
            toast.success('Shift deleted');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete shift');
        }
    };

    const resetForm = () => {
        setCurrentShift({
            name: '',
            startTime: '09:00',
            endTime: '18:00',
            breakDuration: 60,
            isActive: true,
            workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        });
        setIsEditing(false);
        setError(null);
    };

    const handleEdit = (shift: Shift) => {
        setCurrentShift(shift);
        setIsEditing(true);
        setShowModal(true);
    };

    if (user && !can('Shift', 'read')) {
        return <AccessDenied />;
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary-600" />
                        Shift Configuration Matrix
                    </h2>
                    <p className="text-xs text-gray-500">Define and manage operational work patterns</p>
                </div>

                <PermissionGuard module="Shift" action="create">
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 bg-primary-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Shift
                    </button>
                </PermissionGuard>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded text-xs font-bold flex items-center gap-2" role="alert">
                    <Activity className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {shifts.map((shift) => (
                    <div key={shift.id} className="ent-card group hover:border-primary-300 transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-gray-900">{shift.name}</h3>
                                    <span className={`ent-badge ${shift.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                        {shift.isActive ? 'Active' : 'Archived'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PermissionGuard module="Shift" action="update">
                                        <button
                                            onClick={() => handleEdit(shift)}
                                            title="Edit"
                                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard module="Shift" action="delete">
                                        <button
                                            onClick={() => handleDelete(shift.id)}
                                            title="Delete"
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </PermissionGuard>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Timing</p>
                                    <p className="text-sm font-black text-primary-700">
                                        {shift.startTime} <span className="text-gray-400 font-medium">—</span> {shift.endTime}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Break</p>
                                    <p className="text-sm font-bold text-gray-700">{shift.breakDuration} mins</p>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-1">
                                {daysOfWeek.map(day => (
                                    <span
                                        key={day.id}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border ${shift.workDays?.includes(day.id)
                                            ? 'bg-slate-800 text-white border-slate-800'
                                            : 'bg-gray-50 text-gray-300 border-gray-100'
                                            }`}
                                    >
                                        {day.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {shift._count?.employees || 0} Members Assigned
                            </span>
                            <span className="text-gray-300">ID: {shift.id.slice(0, 8)}</span>
                        </div>
                    </div>
                ))}

                {shifts.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-md border-2 border-dashed border-gray-200">
                        <Settings2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-gray-900">No shift protocols defined</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">Create your first operational shift (e.g. Day Shift) to begin workforce scheduling.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
                        <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">{isEditing ? 'Modify Shift' : 'New Shift Protocol'}</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Operational Configuration</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="ent-form-group">
                                <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Shift Label</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Morning Operational Shift"
                                    value={currentShift.name}
                                    onChange={(e) => setCurrentShift({ ...currentShift, name: e.target.value })}
                                    className="ent-input"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="ent-form-group">
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Start Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={currentShift.startTime}
                                        onChange={(e) => setCurrentShift({ ...currentShift, startTime: e.target.value })}
                                        className="ent-input"
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">End Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={currentShift.endTime}
                                        onChange={(e) => setCurrentShift({ ...currentShift, endTime: e.target.value })}
                                        className="ent-input"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="ent-form-group">
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Break (Mins)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={currentShift.breakDuration}
                                        onChange={(e) => setCurrentShift({ ...currentShift, breakDuration: parseInt(e.target.value) })}
                                        className="ent-input"
                                    />
                                </div>
                                <div className="flex flex-col justify-end pb-3">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={currentShift.isActive}
                                            onChange={(e) => setCurrentShift({ ...currentShift, isActive: e.target.checked })}
                                            className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500 rounded"
                                        />
                                        <span className="text-xs font-bold text-gray-700 uppercase">Is Active</span>
                                    </label>
                                </div>
                            </div>

                            <div className="ent-form-group">
                                <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">Active Workdays</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {daysOfWeek.map(day => (
                                        <button
                                            type="button"
                                            key={day.id}
                                            onClick={() => {
                                                const current = currentShift.workDays || [];
                                                const updated = current.includes(day.id)
                                                    ? current.filter(d => d !== day.id)
                                                    : [...current, day.id];
                                                setCurrentShift({ ...currentShift, workDays: updated });
                                            }}
                                            className={`px-2.5 py-1 rounded text-[10px] font-black uppercase transition-all ${currentShift.workDays?.includes(day.id)
                                                ? 'bg-slate-800 text-white border-transparent shadow-md'
                                                : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-400'
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-primary-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-primary-700 shadow-md transition-all active:scale-95"
                                >
                                    {isEditing ? 'Update Shift' : 'Create Protocol'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
