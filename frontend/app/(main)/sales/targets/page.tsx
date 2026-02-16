'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Target, TrendingUp, Plus, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useCurrency } from '@/hooks/useCurrency';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SalesTargetsPage() {
    const [targets, setTargets] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const { formatCurrency } = useCurrency();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        employeeId: '',
        period: 'monthly',
        targetAmount: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });

    // This would typically come from an employee dropdown/API
    const [employees, setEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);

    useEffect(() => {
        fetchTargets();
        fetchEmployees();
    }, []);

    const fetchTargets = async () => {
        try {
            setLoading(true);
            const res = await api.get('/sales/targets');
            setTargets(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load sales targets');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            setEmployeesLoading(true);
            // Fetch employees with 'sales' role or department? 
            // For now, fetch all active employees
            const res = await api.get('/employees?status=active');
            setEmployees(res.data.employees || res.data);
        } catch (error) {
            console.error('Failed to load employees for dropdown');
        } finally {
            setEmployeesLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/sales/targets', formData);
            toast.success('Sales Target created successfully');
            setIsModalOpen(false);
            fetchTargets();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create target');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">
                            Sales Targets
                        </h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wide">
                            Performance Tracking & Goals
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={14} />
                    Set New Target
                </button>
            </div>

            {/* Target List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {targets.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-md border border-dashed border-gray-200">
                        No sales targets set for this period.
                    </div>
                ) : (
                    targets.map((target: any) => {
                        const achieved = target.achievedAmount || 0;
                        const total = target.targetAmount || 1;
                        const progress = Math.min(100, (achieved / total) * 100);

                        return (
                            <div key={target.id} className="ent-card group hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-slate-500">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-gray-900">
                                                {target.employee?.user?.firstName} {target.employee?.user?.lastName}
                                            </h3>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-wide">
                                                {target.period} Goal
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${target.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {target.status}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Target</p>
                                        <p className="text-lg font-black text-gray-900">
                                            {formatCurrency(target.targetAmount)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Achieved</p>
                                        <p className={`text-lg font-black ${progress >= 100 ? 'text-emerald-600' : 'text-primary-600'}`}>
                                            {formatCurrency(achieved)}
                                        </p>
                                    </div>
                                </div>

                                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                                    <div
                                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : 'bg-primary-600'
                                            }`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium border-t border-gray-50 pt-3">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={12} className="text-gray-300" />
                                        <span>{new Date(target.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <span>to</span>
                                    <span>{new Date(target.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-sm font-black uppercase text-gray-900">Set Sales Target</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="ent-label block mb-1.5">Employee</label>
                                    <select
                                        className="ent-input w-full"
                                        value={formData.employeeId}
                                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map((emp: any) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.user?.firstName} {emp.user?.lastName} ({emp.department?.name || 'No Dept'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="ent-label block mb-1.5">Period Type</label>
                                        <select
                                            className="ent-input w-full"
                                            value={formData.period}
                                            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly</option>
                                            <option value="annual">Annual</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="ent-label block mb-1.5">Amount</label>
                                        <input
                                            type="number"
                                            className="ent-input w-full"
                                            placeholder="0.00"
                                            value={formData.targetAmount}
                                            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="ent-label block mb-1.5">Start Date</label>
                                        <input
                                            type="date"
                                            className="ent-input w-full"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="ent-label block mb-1.5">End Date</label>
                                        <input
                                            type="date"
                                            className="ent-input w-full"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 rounded"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Save Target
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
