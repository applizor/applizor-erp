'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, DollarSign, Percent, Archive, CheckCircle } from 'lucide-react';
import { payrollApi, SalaryComponent } from '@/lib/api/payroll';

export default function SalaryComponentsPage() {
    const toast = useToast();
    const router = useRouter();
    const [components, setComponents] = useState<SalaryComponent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingComponent, setEditingComponent] = useState<SalaryComponent | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<SalaryComponent>>({
        name: '',
        type: 'earning',
        calculationType: 'flat',
        defaultValue: 0,
        isActive: true
    });

    useEffect(() => {
        fetchComponents();
    }, []);

    const fetchComponents = async () => {
        try {
            const data = await payrollApi.getComponents();
            setComponents(data);
        } catch (error) {
            console.error('Failed to fetch components', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (component?: SalaryComponent) => {
        if (component) {
            setEditingComponent(component);
            setFormData(component);
        } else {
            setEditingComponent(null);
            setFormData({
                name: '',
                type: 'earning',
                calculationType: 'flat',
                defaultValue: 0,
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingComponent) {
                await payrollApi.updateComponent(editingComponent.id, formData);
            } else {
                await payrollApi.createComponent(formData);
            }
            setIsModalOpen(false);
            fetchComponents();
        } catch (error) {
            console.error('Failed to save component', error);
            toast.error('Failed to save component');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this component?')) return;
        try {
            await payrollApi.deleteComponent(id);
            fetchComponents();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete component');
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading Payroll Settings...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Salary Components</h1>
                    <p className="text-gray-500">Define global earnings and deductions structure</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Component
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">Type</th>
                            <th className="p-4 font-semibold text-gray-600">Calculation</th>
                            <th className="p-4 font-semibold text-gray-600">Default Value</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {components.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400">
                                    No salary components defined yet.
                                </td>
                            </tr>
                        ) : (
                            components.map((comp) => (
                                <tr key={comp.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">{comp.name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${comp.type === 'earning'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {comp.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600 flex items-center gap-2">
                                        {comp.calculationType === 'flat' ? <DollarSign size={16} /> : <Percent size={16} />}
                                        {comp.calculationType === 'flat' ? 'Flat Amount' : '% of Basic'}
                                    </td>
                                    <td className="p-4 text-gray-800 font-mono">
                                        {comp.defaultValue}
                                        {comp.calculationType === 'percentage_basic' && '%'}
                                    </td>
                                    <td className="p-4">
                                        {comp.isActive ? (
                                            <span className="flex items-center gap-1 text-green-600 text-sm">
                                                <CheckCircle size={14} /> Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-gray-400 text-sm">
                                                <Archive size={14} /> Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(comp)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(comp.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-in">
                        <h2 className="text-xl font-bold mb-4">
                            {editingComponent ? 'Edit Component' : 'New Component'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Component Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Basic Salary, HRA"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as 'earning' | 'deduction' })}
                                    >
                                        <option value="earning">Earning (+)</option>
                                        <option value="deduction">Deduction (-)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Calculation</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                                        value={formData.calculationType}
                                        onChange={e => setFormData({ ...formData, calculationType: e.target.value as 'flat' | 'percentage_basic' })}
                                    >
                                        <option value="flat">Flat Amount</option>
                                        <option value="percentage_basic">% of Basic</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {formData.calculationType === 'percentage_basic' ? 'Default Percentage (%)' : 'Default Amount'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.defaultValue}
                                    onChange={e => setFormData({ ...formData, defaultValue: parseFloat(e.target.value) })}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save Component
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
