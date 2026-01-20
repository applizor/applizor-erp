'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { departmentsApi, positionsApi, Position, Department } from '@/lib/api/hrms';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function PositionsPage() {
    const router = useRouter();
    const toast = useToast();
    const [positions, setPositions] = useState<Position[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [currentPosition, setCurrentPosition] = useState<Partial<Position>>({
        title: '',
        departmentId: '',
        description: '',
        isActive: true
    });
    const [isEditing, setIsEditing] = useState(false);
    const [filterDept, setFilterDept] = useState('');

    useEffect(() => {
        loadData();
    }, [filterDept]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [posData, deptData] = await Promise.all([
                positionsApi.getAll(filterDept || undefined),
                departmentsApi.getAll()
            ]);
            setPositions(posData);
            setDepartments(deptData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (pos: Position) => {
        setCurrentPosition(pos);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this position?')) return;
        try {
            await positionsApi.delete(id);
            toast.success('Position deleted successfully');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete position');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (isEditing && currentPosition.id) {
                await positionsApi.update(currentPosition.id, currentPosition);
                toast.success('Position updated successfully');
            } else {
                await positionsApi.create(currentPosition);
                toast.success('Position created successfully');
            }
            setShowModal(false);
            resetForm();
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save position');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setCurrentPosition({ title: '', departmentId: '', description: '', isActive: true });
        setIsEditing(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-medium text-gray-900">Positions</h2>
                    <select
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                        className="border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm"
                >
                    + Add Position
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : positions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No positions found.</div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {positions.map((pos) => (
                            <li key={pos.id} className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-md font-medium text-gray-900">{pos.title}</h3>
                                    <p className="text-sm text-gray-500">
                                        <span className="font-semibold">{pos.department?.name}</span>
                                        {pos.description && ` - ${pos.description}`}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-sm text-gray-500 text-right mr-4">
                                        {pos._count?.employees || 0} Employees
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(pos)}
                                            className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(pos.id)}
                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <h3 className="text-lg font-bold mb-4">{isEditing ? 'Edit Position' : 'Add Position'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Department *</label>
                                    <select
                                        required
                                        value={currentPosition.departmentId}
                                        onChange={(e) => setCurrentPosition({ ...currentPosition, departmentId: e.target.value })}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Position Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentPosition.title}
                                        onChange={(e) => setCurrentPosition({ ...currentPosition, title: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={currentPosition.description || ''}
                                        onChange={(e) => setCurrentPosition({ ...currentPosition, description: e.target.value })}
                                        rows={3}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                {isEditing && (
                                    <div className="flex items-center">
                                        <input
                                            id="isActive"
                                            type="checkbox"
                                            checked={currentPosition.isActive}
                                            onChange={(e) => setCurrentPosition({ ...currentPosition, isActive: e.target.checked })}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                            Active
                                        </label>
                                    </div>
                                )}
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center space-x-2 justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                    >
                                        {saving && <LoadingSpinner size="sm" />}
                                        <span>{saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Position')}</span>
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
