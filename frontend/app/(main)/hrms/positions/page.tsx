'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, X, Briefcase, Activity, Info, ChevronRight, Search, LayoutGrid, Filter } from 'lucide-react';
import { departmentsApi, positionsApi, Position, Department } from '@/lib/api/hrms';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function PositionsPage() {
    const router = useRouter();
    const toast = useToast();
    const [positions, setPositions] = useState<Position[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
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
            toast.error('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (pos: Position) => {
        setCurrentPosition(pos);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await positionsApi.delete(showDeleteConfirm);
            toast.success('Designation purged');
            loadData();
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
            if (isEditing && currentPosition.id) {
                await positionsApi.update(currentPosition.id, currentPosition);
                toast.success('Designation updated');
            } else {
                await positionsApi.create(currentPosition);
                toast.success('Designation registered');
            }
            setShowModal(false);
            resetForm();
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Commit failed');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setCurrentPosition({ title: '', departmentId: '', description: '', isActive: true });
        setIsEditing(false);
    };

    return (
        <div className="space-y-6">
            {/* Semantic Header Component */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary-900 rounded-lg shadow-lg">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Designation Nodes</h2>
                            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">Professional Talent Hierarchy Matrix</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded focus-within:ring-1 focus-within:ring-primary-500/20 transition-all ml-0 sm:ml-4">
                        <Filter size={12} className="text-gray-400" />
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-gray-600 pr-8 py-1.5 cursor-pointer"
                        >
                            <option value="">All Divisions</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <LayoutGrid size={12} />
                        <span>Active Nodes: {positions.filter(p => p.isActive).length}</span>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="px-4 py-2 bg-primary-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-lg shadow-primary-900/10 flex items-center gap-2 transition-all"
                    >
                        <Plus size={14} /> Register Designation
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-40 rounded-lg bg-gray-50 animate-pulse border border-gray-100" />
                    ))
                ) : positions.length === 0 ? (
                    <div className="col-span-full py-24 bg-gray-50/30 rounded-lg border border-dashed border-gray-200 flex flex-col items-center">
                        <Briefcase className="w-10 h-10 text-gray-200 mb-3" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Zero Designation Nodes Registered</p>
                    </div>
                ) : (
                    positions.map((pos) => (
                        <div key={pos.id} className="ent-card group relative p-4 bg-white hover:border-primary-200 transition-all flex flex-col">
                            {/* Identifier Protocol */}
                            <div className="absolute top-3 right-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${pos.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                                    }`}>
                                    {pos.isActive ? 'OPERATIONAL' : 'FROZEN'}
                                </span>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-sm font-black text-gray-900 mb-1 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                                    {pos.title}
                                </h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[8px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100/50">
                                        {pos.department?.name}
                                    </span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-500 line-clamp-2 min-h-[30px] leading-relaxed italic">
                                    {pos.description || 'NO FUNCTIONAL BRIEF FILED'}
                                </p>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${pos._count?.employees ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                        {pos._count?.employees || 0} Occupants
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(pos)}
                                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-all"
                                        title="Modify Configuration"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(pos.id)}
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

            {/* Designation Configuration Portal */}
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
                                        {isEditing ? 'Modify Designation Node' : 'Initialize Designation Node'}
                                    </h3>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="ent-form-group">
                                    <label className="text-[9px] font-black text-gray-500 mb-1 uppercase tracking-widest flex items-center gap-1.5">
                                        Division Assignment <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={currentPosition.departmentId}
                                        onChange={(e) => setCurrentPosition({ ...currentPosition, departmentId: e.target.value })}
                                        className="ent-input w-full p-2.5 text-[11px] font-black tracking-widest cursor-pointer"
                                    >
                                        <option value="">SELECT DIVISION</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ent-form-group">
                                    <label className="text-[9px] font-black text-gray-500 mb-1 uppercase tracking-widest flex items-center gap-1.5">
                                        Professional Nomenclature <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., LEAD ARCHITECT"
                                        value={currentPosition.title}
                                        onChange={(e) => setCurrentPosition({ ...currentPosition, title: e.target.value.toUpperCase() })}
                                        className="ent-input w-full p-2.5 text-[11px] font-black tracking-widest"
                                    />
                                </div>

                                <div className="ent-form-group">
                                    <label className="text-[9px] font-black text-gray-500 mb-1 uppercase tracking-widest flex items-center gap-1.5">
                                        Functional Brief
                                    </label>
                                    <textarea
                                        value={currentPosition.description || ''}
                                        onChange={(e) => setCurrentPosition({ ...currentPosition, description: e.target.value })}
                                        rows={3}
                                        placeholder="Detailed role parameters..."
                                        className="ent-input w-full p-2.5 text-[11px] font-bold resize-none"
                                    />
                                </div>

                                {isEditing && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-100">
                                        <input
                                            id="isActive"
                                            type="checkbox"
                                            checked={currentPosition.isActive}
                                            onChange={(e) => setCurrentPosition({ ...currentPosition, isActive: e.target.checked })}
                                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        />
                                        <label htmlFor="isActive" className="text-[9px] font-black text-gray-700 uppercase tracking-widest cursor-pointer">
                                            Role Availability Status (ACTIVE)
                                        </label>
                                    </div>
                                )}

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
                title="Confirm Designation Deletion"
                message="This will terminate this designation node. Current occupants may require relocation. This action is irreversible."
                type="danger"
                confirmText="Confirm Delete"
            />
        </div>
    );
}
