'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConfirm } from '@/context/ConfirmationContext';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, DollarSign, Percent, Archive, CheckCircle, Settings2, ChevronRight, Activity } from 'lucide-react';
import { payrollApi, SalaryComponent } from '@/lib/api/payroll';
import { CustomSelect } from '@/components/ui/CustomSelect';
import api from '@/lib/api';

export default function PayrollComponentsPage() {
    const toast = useToast();
    const { confirm } = useConfirm();
    const router = useRouter();
    const [components, setComponents] = useState<SalaryComponent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingComponent, setEditingComponent] = useState<SalaryComponent | null>(null);
    const [accounts, setAccounts] = useState<any[]>([]);

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
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/settings/accounts');
            setAccounts(res.data || []);
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        }
    };

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
        if (!await confirm({ message: 'Are you sure you want to delete this component?', type: 'danger' })) return;
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
        <div className="space-y-6">
            {/* Standard Page Header */}
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <Settings2 size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Component Registry</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">Global Remuneration Schema Units</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-md text-[9px] font-black uppercase tracking-widest text-slate-500">
                        <Activity size={12} className="text-primary-600" />
                        <span>Active: {components.filter(c => c.isActive).length} Nodes</span>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn-primary py-2 px-4 text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95"
                    >
                        <Plus size={14} className="mr-2" /> Register Component
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                <div className="ent-table-container">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-gray-100 text-[9px] font-black uppercase tracking-widest text-slate-500">
                            <tr>
                                <th className="px-5 py-4">Component Identity</th>
                                <th className="px-5 py-4">Classification</th>
                                <th className="px-5 py-4">Valuation Protocol</th>
                                <th className="px-5 py-4">Default Magnitude</th>
                                <th className="px-5 py-4">Ledger Account</th>
                                <th className="px-5 py-4">Lifecycle Status</th>
                                <th className="px-5 py-4 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {components.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center text-slate-400 italic font-medium">
                                        No salary components defined yet.
                                    </td>
                                </tr>
                            ) : (
                                components.map((comp) => (
                                    <tr key={comp.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-5 py-4 font-black text-slate-900 uppercase tracking-tight">{comp.name}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${comp.type === 'earning'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-rose-50 text-rose-700 border-rose-100'
                                                }`}>
                                                {comp.type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                                {comp.calculationType === 'flat' ? <DollarSign size={12} className="text-primary-600" /> : <Percent size={12} className="text-primary-600" />}
                                                {comp.calculationType === 'flat' ? 'Flat Magnitude' : 'Formula Computation'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-black text-slate-900">
                                            {comp.defaultValue.toLocaleString()}
                                            {comp.calculationType === 'percentage_basic' && '%'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                                                    {accounts.find(a => a.id === comp.ledgerAccountId)?.code || '---'}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                                                    {accounts.find(a => a.id === comp.ledgerAccountId)?.name || 'Not Mapped'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${comp.isActive
                                                ? 'bg-primary-50 text-primary-700 border-primary-100'
                                                : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                {comp.isActive ? 'OPERATIONAL' : 'ARCHIVED'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3 px-2">
                                                <button
                                                    onClick={() => handleOpenModal(comp)}
                                                    className="text-[9px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-800 transition-colors"
                                                >
                                                    Adjust
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(comp.id)}
                                                    className="text-[9px] font-black text-slate-300 hover:text-rose-600 uppercase tracking-widest transition-colors"
                                                >
                                                    Purge
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="ent-card max-w-sm w-full animate-in fade-in zoom-in duration-300 p-0 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                                {editingComponent ? 'Modify Component Node' : 'Register New Structure'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="ent-form-group">
                                <label className="ent-label">Component Identifier</label>
                                <input
                                    type="text"
                                    required
                                    className="ent-input"
                                    placeholder="e.g. BASIC_SALARY_MANIFEST"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="ent-form-group">
                                    <label className="ent-label">Classification</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'Earning (+)', value: 'earning' },
                                            { label: 'Deduction (-)', value: 'deduction' }
                                        ]}
                                        value={formData.type || 'earning'}
                                        onChange={(val: any) => setFormData({ ...formData, type: val as 'earning' | 'deduction' })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">Valuation Protocol</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'Flat Magnitude', value: 'flat' },
                                            { label: 'Formula Computation', value: 'percentage_basic' }
                                        ]}
                                        value={formData.calculationType || 'flat'}
                                        onChange={(val: any) => setFormData({ ...formData, calculationType: val as 'flat' | 'percentage_basic' })}
                                    />
                                </div>
                            </div>

                            <div className="ent-form-group">
                                <label className="ent-label">
                                    {formData.calculationType === 'percentage_basic' ? 'Default percentage override' : 'Default asset magnitude'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    className="ent-input"
                                    value={formData.defaultValue}
                                    onChange={e => setFormData({ ...formData, defaultValue: parseFloat(e.target.value) })}
                                />
                            </div>

                            <div className="ent-form-group">
                                <label className="ent-label">Accounting: Ledger Account</label>
                                <CustomSelect
                                    options={accounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                                    value={formData.ledgerAccountId || ''}
                                    onChange={(val: any) => setFormData({ ...formData, ledgerAccountId: val })}
                                    placeholder="Select Mapping"
                                />
                                <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Maps this component to chart of accounts</p>
                            </div>

                            <div className="flex items-center gap-3 py-2 px-1">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-3.5 h-3.5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                />
                                <label htmlFor="isActive" className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">Operational status enabled</label>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-50">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="ent-button-secondary"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    Commit Structure
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
