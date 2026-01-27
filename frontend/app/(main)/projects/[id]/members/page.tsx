'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, Trash2, Shield, User } from 'lucide-react';
import { employeesApi } from '@/lib/api/employees';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ProjectMembersPage({ params }: { params: { id: string } }) {
    const toast = useToast();
    const [project, setProject] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Search State
    const [search, setSearch] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        fetchProject();
    }, [params.id]);

    const fetchProject = async () => {
        try {
            const res = await api.get(`/projects/${params.id}`);
            setProject(res.data);
            setMembers(res.data.members || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load members');
        } finally {
            setLoading(false);
        }
    };

    // Search Effect
    useEffect(() => {
        if (search.length > 1) {
            const timer = setTimeout(() => {
                searchEmployees();
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setEmployees([]);
        }
    }, [search]);

    const searchEmployees = async () => {
        setSearchLoading(true);
        try {
            const res = await employeesApi.getAll({ search, limit: 5 });
            const list = res.employees || res;

            // Filter out existing members
            const memberIds = new Set(members.map(m => m.employeeId));
            const available = list.filter((e: any) => !memberIds.has(e.id));

            setEmployees(available);
        } catch (error) {
            console.error(error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleAddMember = async (employeeId: string, role: string = 'member') => {
        try {
            await api.post(`/projects/${params.id}/members`, { employeeId, role });
            toast.success('Member added successfully');
            setSearch('');
            setEmployees([]);
            fetchProject(); // Refresh list
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await api.delete(`/projects/${params.id}/members/${memberId}`);
            toast.success('Member removed');
            fetchProject(); // Refresh list
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to remove member');
        }
    };

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">

            {/* Left: Current Team */}
            <div className="md:col-span-2 space-y-6">
                <div className="ent-card p-0 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <User size={14} className="text-primary-600" />
                            Project Team ({members.length})
                        </h3>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {members.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-xs italic">
                                No members assigned to this project yet.
                            </div>
                        )}
                        {members.map((member) => (
                            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-md bg-white border border-gray-200 text-gray-700 font-black text-sm flex items-center justify-center shadow-sm">
                                        {member.employee.firstName[0]}{member.employee.lastName[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                                            {member.employee.firstName} {member.employee.lastName}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                {member.employee.position?.title || 'No Position'}
                                            </span>
                                            <span className="text-gray-300">|</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${member.role === 'manager' ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {member.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all opacity-0 group-hover:opacity-100"
                                    title="Remove from project"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Add Member */}
            <div className="space-y-6">
                <div className="ent-card p-6 border-t-4 border-t-primary-600">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <UserPlus size={14} className="text-primary-600" />
                        Add Member
                    </h3>

                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                className="ent-input pl-10"
                                placeholder="SEARCH NAME..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Search Results */}
                        {(searchLoading || employees.length > 0) && (
                            <div className="border border-gray-100 rounded-lg overflow-hidden bg-white">
                                {searchLoading && <div className="p-4 flex justify-center"><LoadingSpinner size="sm" /></div>}
                                {!searchLoading && employees.map(emp => (
                                    <button
                                        key={emp.id}
                                        onClick={() => handleAddMember(emp.id)}
                                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center justify-between group transition-colors"
                                    >
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">{emp.firstName} {emp.lastName}</p>
                                            <p className="text-[9px] text-gray-400 uppercase tracking-widest">{emp.position?.title}</p>
                                        </div>
                                        <div className="bg-primary-50 text-primary-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            <UserPlus size={12} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {!searchLoading && employees.length === 0 && search.length > 1 && (
                            <p className="text-[10px] text-gray-400 text-center italic">No matching employees found.</p>
                        )}
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
                    <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Shield size={12} /> Access Control
                    </h4>
                    <p className="text-[10px] text-blue-600 leading-relaxed">
                        Managers have full control over tasks, milestones, and settings. Members can view and edit tasks assigned to them.
                    </p>
                </div>
            </div>
        </div>
    );
}
