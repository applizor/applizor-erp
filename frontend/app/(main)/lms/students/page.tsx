'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEffect, useState } from 'react';
import { studentApi, Student } from '@/lib/api/lms';
import { PermissionGuard } from '@/components/PermissionGuard';
import { usePermission } from '@/hooks/usePermission';
import { Plus, Users, Search, Filter, Trash2, Edit2, UserPlus, Phone, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import PageHeader from '@/components/ui/PageHeader';
import { CustomSelect } from '@/components/ui/CustomSelect';
import api from '@/lib/api';

export default function StudentsPage() {
    const toast = useToast();
    const { can, user } = usePermission();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [onboardType, setOnboardType] = useState<'new' | 'employee'>('new');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState({
        studentId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        status: 'active' as 'active' | 'inactive',
        createAccount: false,
        password: ''
    });
    
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadStudents();
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data || []);
        } catch (error) {
            console.error('Failed to load employees:', error);
        }
    };

    const loadStudents = async () => {
        try {
            setLoading(true);
            const res = await studentApi.list();
            setStudents(res.data || []);
        } catch (error) {
            console.error('Failed to load students:', error);
            toast.error('Failed to fetch students from system');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (student?: Student) => {
        if (student) {
            setEditingStudent(student);
            setOnboardType('new');
            setSelectedEmployeeId('');
            setFormData({
                studentId: student.studentId || '',
                firstName: student.firstName || '',
                lastName: student.lastName || '',
                email: student.email || '',
                phone: student.phone || '',
                dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
                status: student.status || 'active',
                createAccount: false,
                password: ''
            });
        } else {
            setEditingStudent(null);
            setOnboardType('new');
            setSelectedEmployeeId('');
            setFormData({
                studentId: `STUD-${Math.floor(1000 + Math.random() * 9000)}`,
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                dateOfBirth: '',
                status: 'active',
                createAccount: true,
                password: 'password123' // default password for easy setup
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (editingStudent) {
                await studentApi.update(editingStudent.id, {
                    studentId: formData.studentId,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone || undefined,
                    dateOfBirth: formData.dateOfBirth || undefined,
                    status: formData.status,
                    createAccount: formData.createAccount,
                    password: formData.password || undefined
                });
                toast.success('Student profile updated');
            } else {
                await studentApi.create({
                    studentId: formData.studentId,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone || undefined,
                    dateOfBirth: formData.dateOfBirth || undefined,
                    status: formData.status,
                    password: formData.createAccount ? formData.password : undefined,
                    employeeId: onboardType === 'employee' ? selectedEmployeeId : undefined
                });
                toast.success('Student onboarded successfully');
            }
            handleCloseModal();
            loadStudents();
        } catch (error: any) {
            console.error('Failed to submit student form:', error);
            toast.error(error.response?.data?.error || 'Student registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await studentApi.delete(showDeleteConfirm);
            toast.success('Student record purged');
            loadStudents();
        } catch (error: any) {
            console.error('Delete failed:', error);
            toast.error(error.response?.data?.error || 'Failed to delete student');
        } finally {
            setShowDeleteConfirm(null);
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = 
            student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === '' || student.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Student Registry"
                subtitle="Onboard and manage academic nodes"
                icon={Users}
                actions={
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <div className="flex-1 lg:w-64 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="QUERY STUDENT OR ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="ent-input w-full pl-9 py-1.5 text-[10px] font-black tracking-widest"
                            />
                        </div>
                        <PermissionGuard module="Student" action="create">
                            <button
                                onClick={() => handleOpenModal()}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus size={14} /> Onboard Student
                            </button>
                        </PermissionGuard>
                    </div>
                }
            />

            {/* Filtration bar */}
            <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-md border border-gray-100">
                <div className="flex items-center gap-2 px-2 text-gray-400">
                    <Filter size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Filter:</span>
                </div>
                <CustomSelect
                    options={[
                        { label: 'All Statuses', value: '' },
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' }
                    ]}
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    className="min-w-[160px]"
                />
                
                <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-md shadow-sm">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Onboarded:</span>
                    <span className="text-[10px] font-black text-primary-600">{filteredStudents.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 bg-white rounded-md border border-gray-100 shadow-sm min-h-[300px]">
                    <LoadingSpinner />
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-gray-50/30 rounded-md border border-dashed border-gray-200">
                    <Users className="w-8 h-8 text-gray-300 mb-3" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">No students found in directory</p>
                </div>
            ) : (
                <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                    <table className="ent-table w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left p-3">Student ID</th>
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Email</th>
                                <th className="text-left p-3">Phone</th>
                                <th className="text-left p-3">DOB</th>
                                <th className="text-center p-3">Status</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-3 font-mono text-[10px] font-black text-primary-900">{student.studentId}</td>
                                    <td className="p-3 font-semibold text-gray-900">{student.firstName} {student.lastName}</td>
                                    <td className="p-3 text-gray-600">{student.email}</td>
                                    <td className="p-3 text-gray-500 font-mono text-[11px]">{student.phone || '—'}</td>
                                    <td className="p-3 text-gray-500">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'}</td>
                                    <td className="p-3 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                            student.status === 'active' 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                : 'bg-gray-50 text-gray-500 border-gray-200'
                                        }`}>
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <PermissionGuard module="Student" action="update">
                                                <button
                                                    onClick={() => handleOpenModal(student)}
                                                    className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                                    title="Edit profile"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                            </PermissionGuard>
                                            <PermissionGuard module="Student" action="delete">
                                                <button
                                                    onClick={() => setShowDeleteConfirm(student.id)}
                                                    className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                                                    title="Decommission student"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </PermissionGuard>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-md border border-gray-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="bg-primary-900 text-white p-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest">{editingStudent ? 'Edit Student Node' : 'Onboard Student'}</h3>
                                <p className="text-[9px] opacity-75 mt-0.5">REGISTER ACADEMIC ATTRIBUTION IN DIRECTORY</p>
                            </div>
                            <button onClick={handleCloseModal} className="text-white/60 hover:text-white text-sm">✕</button>
                        </div>
                        
                        <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {!editingStudent && (
                                    <div className="ent-form-group col-span-2">
                                        <label className="ent-label">Onboarding Path</label>
                                        <CustomSelect
                                            options={[
                                                { label: 'Register New External Learner', value: 'new' },
                                                { label: 'Link Existing Company Employee', value: 'employee' }
                                            ]}
                                            value={onboardType}
                                            onChange={(val) => {
                                                setOnboardType(val as 'new' | 'employee');
                                                setSelectedEmployeeId('');
                                                if (val === 'employee') {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        firstName: '',
                                                        lastName: '',
                                                        email: '',
                                                        phone: '',
                                                        dateOfBirth: '',
                                                        createAccount: false
                                                    }));
                                                } else {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        createAccount: true,
                                                        password: 'password123'
                                                    }));
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                {!editingStudent && onboardType === 'employee' && (
                                    <div className="ent-form-group col-span-2">
                                        <label className="ent-label">Select Employee *</label>
                                        <CustomSelect
                                            options={employees.map(emp => ({
                                                label: `${emp.firstName} ${emp.lastName} (${emp.email})`,
                                                value: emp.id
                                            }))}
                                            value={selectedEmployeeId}
                                            onChange={(val) => {
                                                setSelectedEmployeeId(val);
                                                const emp = employees.find(e => e.id === val);
                                                if (emp) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        firstName: emp.firstName,
                                                        lastName: emp.lastName,
                                                        email: emp.email,
                                                        phone: emp.phone || '',
                                                        dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '',
                                                    }));
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Student ID</label>
                                    <input
                                        type="text"
                                        className="ent-input"
                                        required
                                        placeholder="e.g. STUD-001"
                                        value={formData.studentId}
                                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">First Name</label>
                                    <input
                                        type="text"
                                        className="ent-input"
                                        required
                                        placeholder="Enter first name"
                                        value={formData.firstName}
                                        disabled={!editingStudent && onboardType === 'employee'}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">Last Name</label>
                                    <input
                                        type="text"
                                        className="ent-input"
                                        required
                                        placeholder="Enter last name"
                                        value={formData.lastName}
                                        disabled={!editingStudent && onboardType === 'employee'}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="ent-input"
                                        required
                                        placeholder="Enter email address"
                                        value={formData.email}
                                        disabled={!editingStudent && onboardType === 'employee'}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">Phone Number</label>
                                    <input
                                        type="text"
                                        className="ent-input"
                                        placeholder="Enter phone number"
                                        value={formData.phone}
                                        disabled={!editingStudent && onboardType === 'employee'}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="ent-input"
                                        value={formData.dateOfBirth}
                                        disabled={!editingStudent && onboardType === 'employee'}
                                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Status</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'Active', value: 'active' },
                                            { label: 'Inactive', value: 'inactive' }
                                        ]}
                                        value={formData.status}
                                        onChange={(val) => setFormData({ ...formData, status: val as any })}
                                    />
                                </div>
                                
                                {!editingStudent && onboardType === 'new' && (
                                    <div className="col-span-2 border-t border-gray-100 pt-3 mt-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <input
                                                type="checkbox"
                                                id="createAccount"
                                                checked={formData.createAccount}
                                                onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <label htmlFor="createAccount" className="text-[10px] font-black uppercase text-gray-700 tracking-wider">Create Portal Account</label>
                                        </div>
                                        
                                        {formData.createAccount && (
                                            <div className="ent-form-group">
                                                <label className="ent-label">Portal Password</label>
                                                <input
                                                    type="password"
                                                    className="ent-input"
                                                    required={formData.createAccount}
                                                    placeholder="Enter login password"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="ent-button-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary"
                                >
                                    {submitting ? 'Processing...' : editingStudent ? 'Update Profile' : 'Onboard Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Confirm Student Purge"
                message="This will completely remove the student and all linked data (enrollments, classes, etc.) from the registry. This action is irreversible."
                type="danger"
                confirmText="Purge Record"
            />
        </div>
    );
}
