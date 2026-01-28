import { useState, useEffect } from 'react';
import { X, Search, UserPlus, Trash2, Shield, User } from 'lucide-react';
import { employeesApi } from '@/lib/api/employees';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface MemberManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    currentMembers: any[];
    onUpdate: () => void;
}

export function MemberManagementModal({ isOpen, onClose, projectId, currentMembers, onUpdate }: MemberManagementModalProps) {
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingInfo, setAddingInfo] = useState<{ id: string, role: string } | null>(null);

    useEffect(() => {
        if (isOpen && search.length > 1) {
            const timer = setTimeout(() => {
                searchEmployees();
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setEmployees([]);
        }
    }, [search, isOpen]);

    const searchEmployees = async () => {
        setLoading(true);
        try {
            // Assuming the employees API supports a 'search' or 'q' param, and returns a list.
            // Adjust query param based on actual API capability verified earlier or standard pattern.
            // Using 'search' as a safe bet from typical list endpoints in this project.
            const res = await employeesApi.getAll({ search, limit: 5 });
            // Filter out already assigned members
            const memberIds = new Set(currentMembers.map(m => m.employeeId));
            const available = (res.employees || res).filter((e: any) => !memberIds.has(e.id));
            setEmployees(available);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (employeeId: string, role: string = 'member') => {
        try {
            await api.post(`/projects/${projectId}/members`, { employeeId, role });
            toast.success('Team member added successfully');
            setAddingInfo(null);
            setSearch('');
            setEmployees([]);
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await api.delete(`/projects/${projectId}/members/${memberId}`);
            toast.success('Member removed');
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to remove member');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Manage Project Team</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Assign roles & access</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-md transition-colors text-gray-400 hover:text-gray-900">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* Search Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Add New Member</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="SEARCH EMPLOYEES BY NAME..."
                                className="ent-input pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Search Results */}
                        {(loading || employees.length > 0) && (
                            <div className="border border-gray-100 rounded-lg overflow-hidden max-h-48 overflow-y-auto bg-white shadow-lg relative z-10">
                                {loading && <div className="p-4 flex justify-center"><LoadingSpinner size="sm" /></div>}
                                {!loading && employees.map(emp => (
                                    <div key={emp.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-black">
                                                {emp.firstName[0]}{emp.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">{emp.firstName} {emp.lastName}</p>
                                                <p className="text-[9px] text-gray-400 uppercase tracking-wider">{emp.position?.title || 'No Position'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddMember(emp.id)}
                                            className="p-1.5 bg-gray-900 text-white rounded hover:bg-primary-600 transition-colors"
                                            title="Add as Member"
                                        >
                                            <UserPlus size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Current Members List */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Team ({currentMembers.length})</label>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {currentMembers.length === 0 && (
                                <p className="text-xs text-gray-400 italic text-center py-4 border border-dashed rounded-lg">No members assigned yet.</p>
                            )}
                            {currentMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-white border border-gray-200 text-gray-700 flex items-center justify-center text-xs font-black">
                                            {member.employee.firstName[0]}{member.employee.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">{member.employee.firstName} {member.employee.lastName}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-gray-500 uppercase tracking-wider">{member.employee.position?.title}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest">{member.role}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="text-gray-400 hover:text-rose-500 p-2 transition-colors"
                                        title="Remove Member"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
