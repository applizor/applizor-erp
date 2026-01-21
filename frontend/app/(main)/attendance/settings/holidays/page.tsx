'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Calendar as CalendarIcon, Plus, Trash2, Edit2 } from 'lucide-react';
import { useConfirm } from '@/context/ConfirmationContext';

interface Holiday {
    id: string;
    name: string;
    date: string;
    isRecurring: boolean;
}

export default function HolidaysPage() {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const { confirm } = useConfirm();
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false
    });

    const currentYear = new Date().getFullYear();

    useEffect(() => {
        loadHolidays();
    }, []);

    const loadHolidays = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/attendance/holidays?year=${currentYear}`);
            setHolidays(res.data);
        } catch (error) {
            console.error('Failed to load holidays:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingHoliday) {
                await api.put(`/attendance/holidays/${editingHoliday.id}`, formData);
            } else {
                await api.post('/attendance/holidays', formData);
            }
            setIsModalOpen(false);
            setEditingHoliday(null);
            setFormData({ name: '', date: '', isRecurring: false });
            loadHolidays();
        } catch (error) {
            console.error('Failed to save holiday:', error);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Holiday Calendar {currentYear}</h2>
                    <p className="text-sm text-gray-500">Manage public and company holidays</p>
                </div>
                <button
                    onClick={() => { setEditingHoliday(null); setFormData({ name: '', date: '', isRecurring: false }); setIsModalOpen(true); }}
                    className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                    <Plus size={18} />
                    <span>Add Holiday</span>
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {holidays.length === 0 ? (
                        <li className="px-6 py-8 text-center text-gray-500">No holidays added for this year.</li>
                    ) : (
                        holidays.map((holiday) => (
                            <li key={holiday.id} className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <CalendarIcon size={20} />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{holiday.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                            {holiday.isRecurring && <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">Recurring</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => {
                                            setEditingHoliday(holiday);
                                            setFormData({
                                                name: holiday.name,
                                                date: new Date(holiday.date).toISOString().split('T')[0],
                                                isRecurring: holiday.isRecurring
                                            });
                                            setIsModalOpen(true);
                                        }}
                                        className="text-gray-400 hover:text-blue-600"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (await confirm({ message: 'Delete holiday?', type: 'danger' })) {
                                                await api.delete(`/attendance/holidays/${holiday.id}`);
                                                loadHolidays();
                                            }
                                        }}
                                        className="text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">{editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={formData.isRecurring}
                                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor="recurring" className="ml-2 block text-sm text-gray-900">
                                    Repeat Yearly?
                                </label>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
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
