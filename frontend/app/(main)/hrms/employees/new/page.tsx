'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { departmentsApi, positionsApi, employeesApi, Department, Position } from '@/lib/api/hrms';
import api from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';
import { UserPlus, ArrowLeft, ChevronRight, Shield, Globe, CreditCard, Activity, Briefcase } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function NewEmployeePage() {
    const router = useRouter();
    const { can, user } = usePermission();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        employeeId: '',
        dateOfJoining: '',
        departmentId: '',
        positionId: '',
        status: 'active',
        createAccount: false,
        password: '',
        roleId: '',
        gender: '',
        dateOfBirth: '',
        bloodGroup: '',
        maritalStatus: '',
        currentAddress: '',
        permanentAddress: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        panNumber: '',
        aadhaarNumber: '',
        employmentType: '',
        hourlyRate: '',
        slackMemberId: '',
        skills: '',
        probationEndDate: '',
        noticePeriodStartDate: '',
        noticePeriodEndDate: ''
    });

    if (user && !can('Employee', 'create')) {
        return <AccessDenied />;
    }

    useEffect(() => {
        loadMetadata();
        fetchRoles();
    }, []);

    useEffect(() => {
        loadPositions();
    }, [formData.departmentId]);

    const loadMetadata = async () => {
        try {
            const depts = await departmentsApi.getAll();
            setDepartments(depts);
        } catch (error) {
            console.error('Failed to load departments:', error);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (error) {
            console.error('Failed to load roles:', error);
        }
    };

    const loadPositions = async () => {
        if (!formData.departmentId) {
            setPositions([]);
            return;
        }
        try {
            const pos = await positionsApi.getAll(formData.departmentId);
            setPositions(pos);
        } catch (error) {
            console.error('Failed to load positions:', error);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError(null);
        try {
            setLoading(true);
            const payload = {
                ...formData,
                departmentId: formData.departmentId || undefined,
                positionId: formData.positionId || undefined,
                dateOfBirth: formData.dateOfBirth || undefined,
                gender: formData.gender || undefined,
                bloodGroup: formData.bloodGroup || undefined,
                maritalStatus: formData.maritalStatus || undefined,
                password: formData.createAccount ? formData.password : undefined,
                roleId: formData.createAccount ? formData.roleId : undefined,
                employmentType: formData.employmentType || undefined,
                hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
                slackMemberId: formData.slackMemberId || undefined,
                probationEndDate: formData.probationEndDate || undefined,
                noticePeriodStartDate: formData.noticePeriodStartDate || undefined,
                noticePeriodEndDate: formData.noticePeriodEndDate || undefined,
                skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : undefined,
            };

            await employeesApi.create(payload);
            router.push('/hrms/employees');
        } catch (error: any) {
            console.error('Create error:', error);
            setError(error.response?.data?.error || error.message || 'Registry creation failed');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'basic', label: 'Core Identity', icon: <UserPlus size={14} /> },
        { id: 'personal', label: 'BioData', icon: <Activity size={14} /> },
        { id: 'address', label: 'Residential', icon: <Globe size={14} /> },
        { id: 'bank', label: 'Compliance', icon: <CreditCard size={14} /> },
        { id: 'other', label: 'Advanced', icon: <Briefcase size={14} /> }
    ];

    const renderTabContent = () => {
        const inputClass = "ent-input w-full p-2.5 text-[11px] font-bold";
        const labelClass = "text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-widest flex items-center gap-1.5";

        switch (activeTab) {
            case 'basic':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="ent-form-group">
                                <label className={labelClass}>Given Name <span className="text-rose-500">*</span></label>
                                <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={inputClass} placeholder="FIRST NAME" />
                            </div>
                            <div className="ent-form-group">
                                <label className={labelClass}>Family Name <span className="text-rose-500">*</span></label>
                                <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={inputClass} placeholder="LAST NAME" />
                            </div>
                            <div className="ent-form-group">
                                <label className={labelClass}>Registry Email <span className="text-rose-500">*</span></label>
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} placeholder="OFFICIAL@DOMAIN.COM" />
                            </div>
                            <div className="ent-form-group">
                                <label className={labelClass}>Contact Protocol</label>
                                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} placeholder="+1-XXX-XXX-XXXX" />
                            </div>
                            <div className="ent-form-group">
                                <label className={labelClass}>Accession Date <span className="text-rose-500">*</span></label>
                                <input type="date" required value={formData.dateOfJoining} onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })} className={inputClass} />
                            </div>
                            <div className="ent-form-group">
                                <label className={labelClass}>Division Schema</label>
                                <CustomSelect
                                    value={formData.departmentId}
                                    onChange={(val) => setFormData({ ...formData, departmentId: val })}
                                    options={[
                                        { label: 'SELECT DIVISION', value: '' },
                                        ...departments.map(dept => ({ label: dept.name.toUpperCase(), value: dept.id }))
                                    ]}
                                    placeholder="SELECT DIVISION"
                                    className={inputClass}
                                />
                            </div>
                            <div className="ent-form-group">
                                <label className={labelClass}>Designation Node</label>
                                <CustomSelect
                                    value={formData.positionId}
                                    onChange={(val) => setFormData({ ...formData, positionId: val })}
                                    options={[
                                        { label: 'SELECT DESIGNATION', value: '' },
                                        ...positions.map(pos => ({ label: pos.title.toUpperCase(), value: pos.id }))
                                    ]}
                                    placeholder="SELECT DESIGNATION"
                                    disabled={!formData.departmentId}
                                    className={`${inputClass}`}
                                />
                            </div>
                            <div className="ent-form-group">
                                <label className={labelClass}>Engagement Status</label>
                                <CustomSelect
                                    value={formData.status}
                                    onChange={(val) => setFormData({ ...formData, status: val })}
                                    options={[
                                        { label: 'ACTIVE DUTY', value: 'active' },
                                        { label: 'INACTIVE CACHE', value: 'inactive' },
                                        { label: 'ON SABBATICAL', value: 'on-leave' },
                                        { label: 'TERMINATED', value: 'terminated' }
                                    ]}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${formData.createAccount ? 'bg-primary-900 border-primary-800 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                                    <Shield size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900">System Observer Portal Access</h4>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.createAccount}
                                                onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">ENABLE CLOUD ECOSYSTEM INTERACTION FOR THIS RESOURCE</p>
                                </div>
                            </div>

                            {formData.createAccount && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="ent-form-group">
                                        <label className={labelClass}>Access Credentials (Password) <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            required={formData.createAccount}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className={inputClass}
                                            placeholder="SET INITIAL KEY"
                                        />
                                    </div>
                                    <div className="ent-form-group">
                                        <label className={labelClass}>Authorization Role <span className="text-rose-500">*</span></label>
                                        <CustomSelect
                                            value={formData.roleId}
                                            onChange={(val) => setFormData({ ...formData, roleId: val })}
                                            options={[
                                                { label: 'SELECT ROLE SCHEMA', value: '' },
                                                ...roles.map(role => ({ label: role.name.toUpperCase(), value: role.id }))
                                            ]}
                                            placeholder="SELECT ROLE SCHEMA"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="md:col-span-2 p-3 bg-primary-50 rounded border border-primary-100 flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-primary-700 uppercase tracking-widest">
                                            AUTHENTICATION IDENTIFIER: <span className="underline">{formData.email || 'PENDING_INPUT'}</span>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'personal':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="ent-form-group">
                            <label className={labelClass}>Date of Genesis (DOB)</label>
                            <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className={inputClass} />
                        </div>
                        <div className="ent-form-group">
                            <label className={labelClass}>Gender Identity</label>
                            <CustomSelect
                                value={formData.gender}
                                onChange={(val) => setFormData({ ...formData, gender: val })}
                                options={[
                                    { label: 'SELECT OPTION', value: '' },
                                    { label: 'MALE', value: 'Male' },
                                    { label: 'FEMALE', value: 'Female' },
                                    { label: 'OTHER', value: 'Other' }
                                ]}
                                placeholder="SELECT OPTION"
                                className={inputClass}
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className={labelClass}>Biological Group (Blood)</label>
                            <input type="text" value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })} className={inputClass} placeholder="E.G. O+" />
                        </div>
                        <div className="ent-form-group">
                            <label className={labelClass}>Social Lifecycle Status</label>
                            <CustomSelect
                                value={formData.maritalStatus}
                                onChange={(val) => setFormData({ ...formData, maritalStatus: val })}
                                options={[
                                    { label: 'SELECT STATUS', value: '' },
                                    { label: 'SINGLE', value: 'Single' },
                                    { label: 'MARRIED', value: 'Married' },
                                    { label: 'DIVORCED', value: 'Divorced' }
                                ]}
                                placeholder="SELECT STATUS"
                                className={inputClass}
                            />
                        </div>
                    </div>
                );
            case 'address':
                return (
                    <div className="space-y-6">
                        <div className="ent-form-group">
                            <label className={labelClass}>Primary Hub (Current Address)</label>
                            <textarea rows={3} value={formData.currentAddress} onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })} className={`${inputClass} resize-none`} placeholder="STREET, SUITE, CITY, REGION, POSTAL" />
                        </div>
                        <div className="ent-form-group">
                            <label className={labelClass}>Base Registry (Permanent Address)</label>
                            <textarea rows={3} value={formData.permanentAddress} onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })} className={`${inputClass} resize-none`} placeholder="STREET, SUITE, CITY, REGION, POSTAL" />
                        </div>
                    </div>
                );
            case 'bank':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="ent-form-group">
                            <label className={labelClass}>Financial Institution</label>
                            <input type="text" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className={inputClass} placeholder="BANK NAME" />
                        </div>
                        <div className="ent-form-group">
                            <label className={labelClass}>Ledger Account Number</label>
                            <input type="text" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} className={inputClass} placeholder="ACC_NUM_INTERNAL" />
                        </div>
                        <div className="ent-form-group">
                            <label className={labelClass}>Routing Protocol (IFSC)</label>
                            <input type="text" value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })} className={inputClass} placeholder="CODE_XXXXX" />
                        </div>
                        <div className="ent-form-group">
                            <label className={labelClass}>Tax Allocation Number (PAN)</label>
                            <input type="text" value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })} className={inputClass} placeholder="ABCDE1234F" />
                        </div>
                        <div className="ent-form-group">
                            <label className={labelClass}>Citizen Identifier (Aadhaar)</label>
                            <input type="text" value={formData.aadhaarNumber} onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })} className={inputClass} placeholder="XXXX-XXXX-XXXX" />
                        </div>
                    </div>
                );
            case 'other':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="ent-form-group">
                            <label className={labelClass}>Engagement Type</label>
                            <CustomSelect
                                value={formData.employmentType}
                                onChange={(val) => setFormData({ ...formData, employmentType: val })}
                                options={[
                                    { label: 'SELECT TYPE', value: '' },
                                    { label: 'FULL TIME', value: 'Full Time' },
                                    { label: 'PART TIME', value: 'Part Time' },
                                    { label: 'CONTRACT', value: 'Contract' },
                                    { label: 'INTERNSHIP', value: 'Internship' },
                                    { label: 'TRAINEE', value: 'Trainee' }
                                ]}
                                placeholder="SELECT TYPE"
                                className={inputClass}
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className={labelClass}>Frequency Rate (Hourly)</label>
                            <input type="number" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })} className={inputClass} placeholder="0.00" />
                        </div>
                        <div className="ent-form-group md:col-span-2">
                            <label className={labelClass}>Competency Tags (Skills)</label>
                            <input type="text" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} className={inputClass} placeholder="REACT, NODEJS, KUBERNETES..." />
                            <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">COMMA-SEPARATED VALUES FOR INDEXING</p>
                        </div>
                        <div className="ent-form-group">
                            <label className={labelClass}>Slack Identifier</label>
                            <input type="text" value={formData.slackMemberId} onChange={(e) => setFormData({ ...formData, slackMemberId: e.target.value })} className={inputClass} placeholder="@UXXXXXXXX" />
                        </div>
                        <div className="ent-form-group">
                            <label className={labelClass}>Probationary Threshold</label>
                            <input type="date" value={formData.probationEndDate} onChange={(e) => setFormData({ ...formData, probationEndDate: e.target.value })} className={inputClass} />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Semantic Navigation & Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/hrms/employees"
                        className="p-2.5 bg-gray-50 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Resource Registration</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">Initialize New Human Capital Node in Registry</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded text-emerald-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Registry Synchronization Active</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center bg-opacity-10 text-rose-600">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-rose-900 uppercase tracking-widest leading-none">Lifecycle Validation Error</h4>
                        <p className="text-[10px] font-bold text-rose-700 mt-1 uppercase tracking-tight">{error}</p>
                    </div>
                </div>
            )}

            <div className="ent-card overflow-hidden">
                <div className="border-b border-gray-100 bg-gray-50/50">
                    <nav className="flex overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 py-4 px-6 border-b-2 font-black text-[10px] uppercase tracking-[0.15em] transition-all whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'border-primary-600 text-primary-600 bg-white shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]'
                                        : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}
                                `}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {renderTabContent()}

                    <div className="flex justify-between items-center pt-8 border-t border-gray-100 mt-10">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Link href="/hrms/employees" className="text-[9px] font-black uppercase tracking-widest hover:text-gray-600 transition-colors">Abort Sequence</Link>
                        </div>

                        <div className="flex items-center gap-3">
                            {activeTab !== 'other' ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const currIdx = tabs.findIndex(t => t.id === activeTab);
                                        if (currIdx < tabs.length - 1) setActiveTab(tabs[currIdx + 1].id);
                                    }}
                                    className="px-6 py-2.5 bg-gray-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-gray-900/10"
                                >
                                    Proceed <ChevronRight size={14} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-2.5 bg-primary-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center gap-2 shadow-lg shadow-primary-900/10 disabled:opacity-50"
                                >
                                    {loading ? 'SYNCHRONIZING...' : 'Commit to Registry'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
