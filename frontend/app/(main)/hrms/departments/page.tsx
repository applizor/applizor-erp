'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, X, Building2, Activity, Info, ChevronRight, Search, LayoutGrid } from 'lucide-react';
import { departmentsApi, Department } from '@/lib/api/hrms';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function DepartmentsPage() {
    const router = useRouter();
    const toast = useToast();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
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
            toast.error('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (dept: Department) => {
        setCurrentDept(dept);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await departmentsApi.delete(showDeleteConfirm);
            toast.success('Division purged');
            loadDepartments();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Purge failed');
        } finally {
            setShowDeleteConfirm(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (isEditing && currentDept.id) {
                await departmentsApi.update(currentDept.id, currentDept);
                toast.success('Registry updated');
            } else {
                await departmentsApi.create(currentDept);
                toast.success('Division initialized');
            }
            setShowModal(false);
            resetForm();
            loadDepartments();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Commit failed');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setCurrentDept({ name: '', description: '', isActive: true });
        setIsEditing(false);
    };

    return (
        <div className="space-y-6">
            {/* Semantic Header Component */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-lg shadow-lg">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Division Schema</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">Global Organizational Structure Matrix</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <LayoutGrid size={12} />
                        <span>Active Units: {departments.filter(d => d.isActive).length}</span>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="px-4 py-2 bg-primary-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-lg shadow-primary-900/10 flex items-center gap-2 transition-all"
                    >
                        <Plus size={14} /> Register Division
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-36 rounded-lg bg-gray-50 animate-pulse border border-gray-100" />
                    ))
                ) : departments.length === 0 ? (
                    <div className="col-span-full py-24 bg-gray-50/30 rounded-lg border border-dashed border-gray-200 flex flex-col items-center">
                        <Building2 className="w-10 h-10 text-gray-200 mb-3" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Zero Operational Divisions Detected</p>
                    </div>
                ) : (
                    departments.map((dept) => (
                        <div key={dept.id} className="ent-card group relative p-4 bg-white hover:border-primary-200 transition-all flex flex-col">
                            {/* Identifier Protocol */}
                            <div className="absolute top-3 right-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${dept.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                                    }`}>
                                    {dept.isActive ? 'OPERATIONAL' : 'DECOMMISSIONED'}
                                </span>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-sm font-black text-gray-900 mb-1 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                                    {dept.name}
                                </h3>
                                <p className="text-[10px] font-bold text-gray-500 line-clamp-2 min-h-[30px] leading-relaxed italic">
                                    {dept.description || 'NO OPERATIONAL BRIEF FILED'}
                                </p>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-primary-600 leading-none">{dept._count?.employees || 0}</span>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Nodes</span>
                                    </div>
                                    <div className="flex flex-col border-l border-gray-100 pl-4">
                                        <span className="text-[11px] font-black text-primary-600 leading-none">{dept._count?.positions || 0}</span>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Roles</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(dept)}
                                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-all"
                                        title="Modify Configuration"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(dept.id)}
                                        className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                                        title="Execute Termination"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Division Configuration Portal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200 animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-primary-900 flex items-center justify-center text-white">
                                        <Activity size={16} />
                                    </div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.1em]">
                                        {isEditing ? 'Modify Division Node' : 'Initialize Division Node'}
                                    </h3>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="ent-form-group">
                                    <label className="text-[9px] font-black text-gray-500 mb-1 uppercase tracking-widest flex items-center gap-1.5">
                                        Division Nomenclature <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="STRATEGIC OPERATIONS"
                                        value={currentDept.name}
                                        onChange={(e) => setCurrentDept({ ...currentDept, name: e.target.value.toUpperCase() })}
                                        className="ent-input w-full p-2.5 text-[11px] font-black tracking-widest"
                                    />
                                </div>

                                <div className="ent-form-group">
                                    <label className="text-[9px] font-black text-gray-500 mb-1 uppercase tracking-widest flex items-center gap-1.5">
                                        Operational Brief
                                    </label>
                                    <textarea
                                        value={currentDept.description || ''}
                                        onChange={(e) => setCurrentDept({ ...currentDept, description: e.target.value })}
                                        rows={3}
                                        placeholder="Detailed functional parameters..."
                                        className="ent-input w-full p-2.5 text-[11px] font-bold resize-none"
                                    />
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-100">
                                    <input
                                        id="isActive"
                                        type="checkbox"
                                        checked={currentDept.isActive}
                                        onChange={(e) => setCurrentDept({ ...currentDept, isActive: e.target.checked })}
                                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="isActive" className="text-[9px] font-black text-gray-700 uppercase tracking-widest cursor-pointer">
                                        Current Operational Status (ACTIVE)
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2 bg-primary-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center gap-2"
                                    >
                                        {saving ? 'SYNCHRONIZING...' : (isEditing ? 'Commit Changes' : 'Execute Creation')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Confirm Division Deletion"
                message="This will terminate this division module. All nested node assignments may be affected. This action is irreversible."
                type="danger"
                confirmText="Confirm Delete"
            />
        </div>
    );
}
