'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEffect, useState } from 'react';
import { holidaysApi, Holiday } from '@/lib/api/attendance';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Plus, Trash2, Calendar, Globe, Building2, Briefcase, X } from 'lucide-react';

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

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this holiday?')) {
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

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-600" />
                        Holiday Calendar ({new Date().getFullYear()})
                    </h2>
                    <p className="text-xs text-gray-500">Official company and public holiday ledger</p>
                </div>

                <PermissionGuard module="Holiday" action="create">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-primary-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Holiday
                    </button>
                </PermissionGuard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {holidays.map((holiday) => (
                    <div key={holiday.id} className="ent-card flex flex-col justify-between group hover:border-primary-300 transition-all">
                        <div>
                            <div className="flex justify-between items-start">
                                <span className={`ent-badge flex items-center gap-1.5 ${holiday.type === 'national' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        holiday.type === 'regional' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            'bg-purple-50 text-purple-700 border-purple-200'
                                    }`}>
                                    {getHolidayIcon(holiday.type)}
                                    {holiday.type}
                                </span>
                                <PermissionGuard module="Holiday" action="delete">
                                    <button
                                        onClick={() => handleDelete(holiday.id)}
                                        title="Delete"
                                        className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </PermissionGuard>
                            </div>
                            <div className="mt-3">
                                <h3 className="text-sm font-bold text-gray-900 truncate" title={holiday.name}>{holiday.name}</h3>
                                <div className="mt-1 flex items-baseline gap-1 text-primary-600">
                                    <span className="text-xl font-black tracking-tight">
                                        {new Date(holiday.date).getDate()}
                                    </span>
                                    <span className="text-xs font-bold uppercase">
                                        {new Date(holiday.date).toLocaleDateString(undefined, { month: 'short', weekday: 'short' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {holidays.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-500">No holidays scheduled for this cycle.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
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
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="ent-select"
                                    >
                                        <option value="national">National</option>
                                        <option value="regional">Regional</option>
                                        <option value="company">Company</option>
                                    </select>
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
