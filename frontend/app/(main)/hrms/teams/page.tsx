'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, X, Users, Activity, LayoutGrid, Search, UserPlus, Shield, UserMinus } from 'lucide-react';
import { teamsApi } from '@/lib/api/teams';
import { employeesApi, Employee } from '@/lib/api/hrms';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomSelect } from '@/components/ui/CustomSelect';
import PageHeader from '@/components/ui/PageHeader';

interface TeamMember {
    id: string;
    teamId: string;
    employeeId: string;
    joinedAt: string;
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        position?: { title: string };
        department?: { name: string };
    };
}

interface Team {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    members?: TeamMember[];
    _count?: {
        members: number;
    };
}

export default function TeamsPage() {
    const toast = useToast();
    const router = useRouter();
    const { can, user } = usePermission();

    const [teams, setTeams] = useState<Team[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Team CRUD Modals
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTeam, setCurrentTeam] = useState<Partial<Team>>({
        name: '',
        description: '',
        isActive: true
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Member Management Modal
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            loadTeams();
            loadEmployees();
        }
    }, [user]);

    const loadTeams = async () => {
        try {
            setLoading(true);
            const data = await teamsApi.getAll();
            setTeams(data);
        } catch (error: any) {
            console.error('Failed to load teams:', error);
            toast.error('Sync failed: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const loadEmployees = async () => {
        try {
            const data = await employeesApi.getAll({ status: 'active' });
            setEmployees(data);
        } catch (error) {
            console.error('Failed to load employees:', error);
        }
    };

    const handleEdit = (team: Team) => {
        setCurrentTeam(team);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await teamsApi.delete(showDeleteConfirm);
            toast.success('Team pruned');
            loadTeams();
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
            if (isEditing && currentTeam.id) {
                await teamsApi.update(currentTeam.id, currentTeam);
                toast.success('Team updated');
            } else {
                await teamsApi.create({
                    name: currentTeam.name!,
                    description: currentTeam.description
                });
                toast.success('Team initialized');
            }
            setShowModal(false);
            resetForm();
            loadTeams();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Commit failed');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setCurrentTeam({ name: '', description: '', isActive: true });
        setIsEditing(false);
    };

    // Member Management Flow
    const handleManageMembers = async (team: Team) => {
        setSelectedTeam(team);
        setShowMembersModal(true);
        setLoadingMembers(true);
        setSelectedEmployeeId('');
        try {
            const detailedTeam = await teamsApi.getById(team.id);
            setSelectedTeam(detailedTeam);
        } catch (error: any) {
            toast.error('Failed to load team members');
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleAddMember = async () => {
        if (!selectedTeam || !selectedEmployeeId) return;
        try {
            setLoadingMembers(true);
            await teamsApi.addMember(selectedTeam.id, selectedEmployeeId);
            toast.success('Member added to team');
            setSelectedEmployeeId('');
            
            // Reload detailed team
            const detailedTeam = await teamsApi.getById(selectedTeam.id);
            setSelectedTeam(detailedTeam);
            loadTeams(); // Refresh counters on page
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to add member');
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!selectedTeam) return;
        try {
            setLoadingMembers(true);
            await teamsApi.removeMember(selectedTeam.id, memberId);
            toast.success('Member removed from team');
            
            // Reload detailed team
            const detailedTeam = await teamsApi.getById(selectedTeam.id);
            setSelectedTeam(detailedTeam);
            loadTeams(); // Refresh counters on page
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to remove member');
        } finally {
            setLoadingMembers(false);
        }
    };

    // Filtering Teams
    const filteredTeams = teams.filter((team) => {
        const query = searchQuery.toLowerCase();
        const name = (team.name || '').toLowerCase();
        const desc = (team.description || '').toLowerCase();
        return name.includes(query) || desc.includes(query);
    });

    // Determine available employees for dropdown (those not already in the team)
    const availableEmployees = employees.filter((emp) => {
        if (!selectedTeam?.members) return true;
        return !selectedTeam.members.some((m) => m.employeeId === emp.id);
    });

    const selectOptions = availableEmployees.map((emp) => ({
        label: `${emp.firstName} ${emp.lastName} (${emp.position?.title || 'No Title'})`,
        value: emp.id,
        description: emp.email
    }));

    return (
        <div className="flex flex-col gap-6">
            {/* Header Component */}
            <PageHeader
                title="Team Registry"
                subtitle="OPERATIONAL COLLABORATION UNIT MATRIX"
                icon={Users}
                actions={
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex-1 lg:w-64 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="QUERY TEAMS..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="ent-input w-full pl-9 py-1.5 text-[10px] font-black tracking-widest"
                            />
                        </div>
                        {can('EmployeeTeam', 'create') && (
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="px-4 py-2 bg-primary-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-lg shadow-primary-900/10 flex items-center gap-2 transition-all shrink-0"
                            >
                                <Plus size={14} /> Register Team
                            </button>
                        )}
                    </div>
                }
            />

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-md border border-gray-100">
                <div className="flex items-center gap-2 px-2 text-gray-400">
                    <LayoutGrid size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Active Units:</span>
                    <span className="text-[10px] font-black text-primary-600">{teams.filter(t => t.isActive).length}</span>
                </div>
            </div>

            {/* Teams Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-36 rounded-md bg-gray-50 animate-pulse border border-gray-100" />
                    ))
                ) : filteredTeams.length === 0 ? (
                    <div className="col-span-full py-24 bg-gray-50/30 rounded-md border border-dashed border-gray-200 flex flex-col items-center">
                        <Users className="w-10 h-10 text-gray-200 mb-3" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Zero Active Collaboration Teams Detected</p>
                    </div>
                ) : (
                    filteredTeams.map((team) => (
                        <div key={team.id} className="ent-card group relative p-4 bg-white hover:border-primary-200 transition-all flex flex-col justify-between min-h-[160px]">
                            {/* Operational Status */}
                            <div className="absolute top-3 right-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${team.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                    {team.isActive ? 'OPERATIONAL' : 'DECOMMISSIONED'}
                                </span>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-sm font-black text-gray-900 mb-1 group-hover:text-primary-600 transition-colors uppercase tracking-tight pr-24">
                                    {team.name}
                                </h3>
                                <p className="text-[10px] font-bold text-gray-500 line-clamp-2 min-h-[30px] leading-relaxed italic pr-4">
                                    {team.description || 'NO OPERATIONAL BRIEF FILED'}
                                </p>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-primary-600 leading-none">{team._count?.members || 0}</span>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Members</span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleManageMembers(team)}
                                        className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-primary-600 hover:text-primary-850 hover:bg-primary-50 rounded-md border border-primary-100 transition-all flex items-center gap-1"
                                        title="Manage Team Members"
                                    >
                                        <UserPlus size={12} /> Members
                                    </button>
                                    {can('EmployeeTeam', 'update') && (
                                        <button
                                            onClick={() => handleEdit(team)}
                                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-all"
                                            title="Modify Configuration"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    )}
                                    {can('EmployeeTeam', 'delete') && (
                                        <button
                                            onClick={() => setShowDeleteConfirm(team.id)}
                                            className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                                            title="Purge Team"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Register/Modify Team Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-gray-200 animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-primary-900 flex items-center justify-center text-white">
                                        <Activity size={16} />
                                    </div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.1em]">
                                        {isEditing ? 'Modify Team Node' : 'Initialize Team Node'}
                                    </h3>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="ent-form-group">
                                    <label className="text-[9px] font-black text-gray-500 mb-1 uppercase tracking-widest flex items-center gap-1.5">
                                        Team Nomenclature <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="SALES FORCE ALPHA"
                                        value={currentTeam.name}
                                        onChange={(e) => setCurrentTeam({ ...currentTeam, name: e.target.value.toUpperCase() })}
                                        className="ent-input w-full p-2.5 text-[11px] font-black tracking-widest"
                                    />
                                </div>

                                <div className="ent-form-group">
                                    <label className="text-[9px] font-black text-gray-500 mb-1 uppercase tracking-widest flex items-center gap-1.5">
                                        Operational Brief
                                    </label>
                                    <textarea
                                        value={currentTeam.description || ''}
                                        onChange={(e) => setCurrentTeam({ ...currentTeam, description: e.target.value })}
                                        rows={3}
                                        placeholder="Detailed functional parameters, goals, and focus areas..."
                                        className="ent-input w-full p-2.5 text-[11px] font-bold resize-none"
                                    />
                                </div>

                                {isEditing && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                                        <input
                                            id="isActive"
                                            type="checkbox"
                                            checked={currentTeam.isActive}
                                            onChange={(e) => setCurrentTeam({ ...currentTeam, isActive: e.target.checked })}
                                            className="h-4 w-4 text-primary-600 border-gray-300 rounded-md focus:ring-primary-500"
                                        />
                                        <label htmlFor="isActive" className="text-[9px] font-black text-gray-700 uppercase tracking-widest cursor-pointer">
                                            Current Operational Status (ACTIVE)
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
                                        className="px-6 py-2 bg-primary-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center gap-2"
                                    >
                                        {saving ? 'SYNCHRONIZING...' : (isEditing ? 'Commit Changes' : 'Execute Creation')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Members Drawer/Modal */}
            {showMembersModal && selectedTeam && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md shadow-2xl max-w-lg w-full border border-gray-200 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-primary-900 flex items-center justify-center text-white">
                                    <Users size={16} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.1em]">
                                        Manage Team Nodes
                                    </h3>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                        {selectedTeam.name}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {/* Add Member Tool */}
                            {can('EmployeeTeam', 'update') && (
                                <div className="p-4 bg-gray-50 border border-gray-150 rounded-md space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
                                        <UserPlus size={12} className="text-primary-600" /> Assign New Node to Team
                                    </h4>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1">
                                            <CustomSelect
                                                options={selectOptions}
                                                value={selectedEmployeeId}
                                                onChange={setSelectedEmployeeId}
                                                placeholder="SEARCH EMPLOYEE REGISTRY..."
                                                className="w-full"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddMember}
                                            disabled={loadingMembers || !selectedEmployeeId}
                                            className="px-5 py-2.5 bg-primary-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-stretch sm:self-end flex items-center justify-center gap-1"
                                        >
                                            Add Node
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Current Members List */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Current Enrolled Members ({selectedTeam.members?.length || 0})
                                </h4>

                                {loadingMembers && !selectedTeam.members ? (
                                    <div className="flex justify-center py-6">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                ) : !selectedTeam.members || selectedTeam.members.length === 0 ? (
                                    <div className="py-8 bg-gray-50/50 rounded border border-dashed border-gray-150 text-center flex flex-col items-center justify-center">
                                        <Users className="w-8 h-8 text-gray-300 mb-2" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">No Employees Enrolled in this Team</span>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 max-h-[40vh] overflow-y-auto pr-1">
                                        {selectedTeam.members.map((member) => (
                                            <div key={member.id} className="py-2.5 flex items-center justify-between group">
                                                <div className="overflow-hidden pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-gray-900 uppercase">
                                                            {member.employee.firstName} {member.employee.lastName}
                                                        </span>
                                                        {member.employee.position?.title && (
                                                            <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                                {member.employee.position.title}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] text-gray-400 font-bold tracking-tight block">
                                                        {member.employee.email} | {member.employee.department?.name || 'No Division'}
                                                    </span>
                                                </div>

                                                {can('EmployeeTeam', 'update') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMember(member.id)}
                                                        disabled={loadingMembers}
                                                        className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                                        title="Revoke Enrollment"
                                                    >
                                                        <UserMinus size={13} />
                                                        <span className="text-[8px] font-black uppercase tracking-wider hidden sm:inline">Revoke</span>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowMembersModal(false)}
                                className="px-5 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Close Matrix
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Confirm Team Deletion"
                message="This will terminate this team registry record. Member assignment mappings will be permanently deleted. This action is irreversible."
                type="danger"
                confirmText="Confirm Delete"
            />
        </div>
    );
}
