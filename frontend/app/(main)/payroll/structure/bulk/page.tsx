'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';
import { departmentsApi, employeesApi } from '@/lib/api/hrms';
import { Search, Filter, CheckSquare, Square, Save, Users, Layers, AlertCircle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function BulkAssignPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);

    // Filters
    const [deptFilter, setDeptFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Selection
    const [selectedEmpIds, setSelectedEmpIds] = useState<Set<string>>(new Set());

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [empsRes, deptsRes, templatesRes] = await Promise.all([
                api.get('/employees?status=active'), // Only active employees
                departmentsApi.getAll(),
                api.get('/salary-templates')
            ]);
            setEmployees(empsRes.data);
            setDepartments(deptsRes);
            setTemplates(templatesRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredEmployees = employees.filter(emp => {
        const matchDept = deptFilter ? emp.departmentId === deptFilter : true;
        const matchSearch = searchQuery ? (
            emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
        ) : true;
        return matchDept && matchSearch;
    });

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedEmpIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedEmpIds(newSet);
    };

    const toggleAll = () => {
        if (selectedEmpIds.size === filteredEmployees.length) {
            setSelectedEmpIds(new Set());
        } else {
            const newSet = new Set(filteredEmployees.map(e => e.id));
            setSelectedEmpIds(newSet);
        }
    };

    const handleAssign = async () => {
        if (!selectedTemplate) {
            toast.warning('Please select a template');
            return;
        }

        try {
            setAssigning(true);
            await api.post('/payroll/structure/bulk-assign', {
                templateId: selectedTemplate,
                employeeIds: Array.from(selectedEmpIds)
            });
            toast.success(`Template assigned to ${selectedEmpIds.size} employees`);
            setShowModal(false);
            setSelectedEmpIds(new Set());
            setSelectedTemplate('');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Assignment failed');
        } finally {
            setAssigning(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in pb-20 max-w-7xl mx-auto px-4 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">Bulk Structure Assignment</h1>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Apply Salary Templates to Multiple Employees</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowModal(true)}
                        disabled={selectedEmpIds.size === 0}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Layers size={14} className="mr-2" />
                        Assign Template ({selectedEmpIds.size})
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="ent-card p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by ID or Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ent-input w-full pl-9"
                    />
                </div>
                <div className="w-full md:w-64">
                    <CustomSelect
                        options={[{ label: 'All Departments', value: '' }, ...departments.map(d => ({ label: d.name, value: d.id }))]}
                        value={deptFilter}
                        onChange={setDeptFilter}
                        placeholder="Filter by Department"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="ent-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="ent-table w-full text-left">
                        <thead>
                            <tr>
                                <th className="w-10 p-4">
                                    <button onClick={toggleAll} className="text-slate-400 hover:text-primary-600">
                                        {selectedEmpIds.size > 0 && selectedEmpIds.size === filteredEmployees.length ? <CheckSquare size={16} /> : <Square size={16} />}
                                    </button>
                                </th>
                                <th className="p-4">Employee</th>
                                <th className="p-4">Department</th>
                                <th className="p-4">Designation</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">No employees found</td>
                                </tr>
                            ) : (
                                filteredEmployees.map(emp => (
                                    <tr key={emp.id} className={`hover:bg-slate-50/50 transition-colors ${selectedEmpIds.has(emp.id) ? 'bg-blue-50/30' : ''}`}>
                                        <td className="p-4">
                                            <button onClick={() => toggleSelection(emp.id)} className={`text-slate-300 hover:text-primary-600 ${selectedEmpIds.has(emp.id) ? 'text-primary-600' : ''}`}>
                                                {selectedEmpIds.has(emp.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="text-xs font-black text-slate-900">{emp.firstName} {emp.lastName}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{emp.employeeId}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-bold text-slate-600">{emp.department?.name || '-'}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-bold text-slate-600">{emp.position?.title || '-'}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assignment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Assign Salary Structure</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded flex items-start gap-3">
                                <Users size={16} className="text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-blue-900">Selected Employees: {selectedEmpIds.size}</p>
                                    <p className="text-[10px] text-blue-700 mt-0.5">Existing structures will be overwritten.</p>
                                </div>
                            </div>

                            <div className="ent-form-group">
                                <label className="ent-label">Select Salary Template</label>
                                <CustomSelect
                                    options={[{ label: 'Select Template', value: '' }, ...templates.map(t => ({ label: `${t.name} (${t.structureType})`, value: t.id }))]}
                                    value={selectedTemplate}
                                    onChange={setSelectedTemplate}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleAssign} disabled={assigning} className="btn-primary">
                                {assigning ? <LoadingSpinner size="sm" className="mr-2" /> : <Save size={14} className="mr-2" />}
                                Assign Structure
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
