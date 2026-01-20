'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import { holidaysApi, Holiday } from '@/lib/api/attendance';
import { PermissionGuard } from '@/components/PermissionGuard';

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
        } catch (error) {
            console.error('Failed to create holiday:', error);
            toast.error('Failed to add holiday');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this holiday?')) {
            try {
                await holidaysApi.delete(id);
                loadData();
            } catch (error) {
                console.error('Failed to delete:', error);
                toast.error('Failed to delete holiday');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Holidays ({new Date().getFullYear()})</h2>
                    <p className="text-sm text-gray-500">Company holiday calendar</p>
                </div>

                <PermissionGuard module="Holiday" action="create">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                    >
                        + Add Holiday
                    </button>
                </PermissionGuard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {holidays.map((holiday) => (
                    <div key={holiday.id} className="bg-white shadow rounded-lg p-6 border border-gray-200 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start">
                                <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded uppercase">
                                    {holiday.type}
                                </div>
                                {/* Add delete button only for admin if needed, currently open for demo */}
                                <button onClick={() => handleDelete(holiday.id)} className="text-gray-400 hover:text-red-500">
                                    &times;
                                </button>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">{holiday.name}</h3>
                                <p className="mt-1 text-2xl font-bold text-gray-700">
                                    {new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                {holidays.length === 0 && (
                    <div className="col-span-full py-10 text-center text-gray-500 bg-white shadow rounded-lg">
                        No holidays found for this year.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full m-4">
                        <div className="flex justify-between items-center p-5 border-b">
                            <h3 className="text-xl font-medium text-gray-900">Add Holiday</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Holiday Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="national">National Holiday</option>
                                    <option value="regional">Regional Holiday</option>
                                    <option value="company">Company Holiday</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
