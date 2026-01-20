'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PermissionGuard } from '@/components/PermissionGuard';
import AccessDenied from '@/components/AccessDenied';

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

    // Page Level Security
    if (user && !can('Shift', 'read')) {
        return <AccessDenied />;
    }

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
            } else {
                await api.post('/shifts', currentShift);
            }
            setShowModal(false);
            resetForm();
            loadShifts();
        } catch (error: any) {
            console.error('Save error:', error);
            const msg = error.response?.data?.error || 'Failed to save shift';
            setError(msg);
            // Also show valid alert for modal context if needed, but better to show in modal
            toast.error(msg);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will remove the shift from the system.')) return;
        try {
            await api.delete(`/shifts/${id}`);
            loadShifts();
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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Shift Management</h2>
                <PermissionGuard module="Shift" action="create">
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm"
                    >
                        + Add Shift
                    </button>
                </PermissionGuard>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-4 rounded-md shadow animate-pulse flex justify-between">
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                                <div className="h-3 bg-gray-100 rounded w-48"></div>
                            </div>
                            <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {shifts.map((shift) => (
                            <li key={shift.id} className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="text-md font-medium text-gray-900">{shift.name}</h3>
                                        {shift.isActive ? (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                                        ) : (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {shift.startTime} - {shift.endTime} • {shift.breakDuration} mins break
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {daysOfWeek.map(day => (
                                            <span
                                                key={day.id}
                                                className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${shift.workDays?.includes(day.id)
                                                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                                                    : 'bg-gray-50 text-gray-400 border border-gray-100'
                                                    }`}
                                            >
                                                {day.label}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Assigned to {shift._count?.employees || 0} employees
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <PermissionGuard module="Shift" action="update">
                                        <button onClick={() => handleEdit(shift)} className="text-primary-600 hover:text-primary-900 text-sm">Edit</button>
                                    </PermissionGuard>
                                    <PermissionGuard module="Shift" action="delete">
                                        <button onClick={() => handleDelete(shift.id)} className="text-red-600 hover:text-red-900 text-sm">Delete</button>
                                    </PermissionGuard>
                                </div>
                            </li>
                        ))}
                        {shifts.length === 0 && (
                            <li className="px-6 py-8 text-center text-gray-500">
                                No shifts defined. Create a shift (e.g. "General Shift") to get started.
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <h3 className="text-lg font-bold mb-4">{isEditing ? 'Edit Shift' : 'Add Shift'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Shift Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Morning Shift"
                                        value={currentShift.name}
                                        onChange={(e) => setCurrentShift({ ...currentShift, name: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Start Time *</label>
                                        <input
                                            type="time"
                                            required
                                            value={currentShift.startTime}
                                            onChange={(e) => setCurrentShift({ ...currentShift, startTime: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">End Time *</label>
                                        <input
                                            type="time"
                                            required
                                            value={currentShift.endTime}
                                            onChange={(e) => setCurrentShift({ ...currentShift, endTime: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Break Duration (mins)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={currentShift.breakDuration}
                                        onChange={(e) => setCurrentShift({ ...currentShift, breakDuration: parseInt(e.target.value) })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Days</label>
                                    <div className="flex flex-wrap gap-2">
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
                                                className={`px-3 py-1 rounded text-xs border ${currentShift.workDays?.includes(day.id)
                                                    ? 'bg-primary-600 text-white border-primary-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center mt-2">
                                    <input
                                        type="checkbox"
                                        id="active-check"
                                        checked={currentShift.isActive}
                                        onChange={(e) => setCurrentShift({ ...currentShift, isActive: e.target.checked })}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="active-check" className="ml-2 block text-sm text-gray-900">Active</label>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-primary-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700"
                                    >
                                        {isEditing ? 'Save Changes' : 'Create Shift'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
