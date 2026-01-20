'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { departmentsApi, Department } from '@/lib/api/hrms';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DepartmentsPage() {
    const router = useRouter();
    const toast = useToast();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [currentDept, setCurrentDept] = useState<Partial<Department>>({
        name: '',
        description: '',
        isActive: true
    });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        try {
            setLoading(true);
            const data = await departmentsApi.getAll();
            setDepartments(data);
        } catch (error) {
            console.error('Failed to load departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (dept: Department) => {
        setCurrentDept(dept);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this department?')) return;
        try {
            await departmentsApi.delete(id);
            toast.success('Department deleted successfully');
            loadDepartments();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete department');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (isEditing && currentDept.id) {
                await departmentsApi.update(currentDept.id, currentDept);
                toast.success('Department updated successfully');
            } else {
                await departmentsApi.create(currentDept);
                toast.success('Department created successfully');
            }
            setShowModal(false);
            resetForm();
            loadDepartments();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save department');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setCurrentDept({ name: '', description: '', isActive: true });
        setIsEditing(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Departments</h2>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm"
                >
                    + Add Department
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : departments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No departments found. Create one to get started.</div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {departments.map((dept) => (
                            <li key={dept.id} className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-md font-medium text-gray-900">{dept.name}</h3>
                                    <p className="text-sm text-gray-500">{dept.description || 'No description'}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-sm text-gray-500 text-right mr-4">
                                        <div>{dept._count?.employees || 0} Employees</div>
                                        <div>{dept._count?.positions || 0} Positions</div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(dept)}
                                            className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(dept.id)}
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
                            <h3 className="text-lg font-bold mb-4">{isEditing ? 'Edit Department' : 'Add Department'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Department Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentDept.name}
                                        onChange={(e) => setCurrentDept({ ...currentDept, name: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={currentDept.description || ''}
                                        onChange={(e) => setCurrentDept({ ...currentDept, description: e.target.value })}
                                        rows={3}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                {isEditing && (
                                    <div className="flex items-center">
                                        <input
                                            id="isActive"
                                            type="checkbox"
                                            checked={currentDept.isActive}
                                            onChange={(e) => setCurrentDept({ ...currentDept, isActive: e.target.checked })}
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
                                        <span>{saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Department')}</span>
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
