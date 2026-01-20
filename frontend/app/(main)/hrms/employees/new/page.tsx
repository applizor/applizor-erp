'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { departmentsApi, positionsApi, employeesApi, Department, Position } from '@/lib/api/hrms';
import api from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';

export default function NewEmployeePage() {
    const router = useRouter();
    const { can, user } = usePermission();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [roles, setRoles] = useState<any[]>([]); // Roles state
    const [loading, setLoading] = useState(false);

    // Page Level Security
    if (user && !can('Employee', 'create')) {
        return <AccessDenied />;
    }
    const [activeTab, setActiveTab] = useState('basic');

    const [formData, setFormData] = useState({
        // Basic
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        employeeId: '',
        dateOfJoining: '',
        departmentId: '',
        positionId: '',
        status: 'active',

        // User Account
        createAccount: false,
        password: '',
        roleId: '',

        // Personal
        gender: '',
        dateOfBirth: '',
        bloodGroup: '',
        maritalStatus: '',

        // Address
        currentAddress: '',
        permanentAddress: '',

        // Bank & Statutory
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        panNumber: '',
        aadhaarNumber: '',

        // Other Details
        employmentType: '',
        hourlyRate: '',
        slackMemberId: '',
        skills: '', // Comma separated string for UI
        probationEndDate: '',
        noticePeriodStartDate: '',
        noticePeriodEndDate: ''
    });

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

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError(null);
        try {
            setLoading(true);

            // Clean up payload
            const payload = {
                ...formData,
                departmentId: formData.departmentId || undefined,
                positionId: formData.positionId || undefined,
                dateOfBirth: formData.dateOfBirth || undefined,
                gender: formData.gender || undefined,
                bloodGroup: formData.bloodGroup || undefined,
                maritalStatus: formData.maritalStatus || undefined,
                // Only send password/role if createAccount is true
                password: formData.createAccount ? formData.password : undefined,
                roleId: formData.createAccount ? formData.roleId : undefined,

                // Optional advanced fields
                employmentType: formData.employmentType || undefined,
                hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
                slackMemberId: formData.slackMemberId || undefined,
                probationEndDate: formData.probationEndDate || undefined,
                noticePeriodStartDate: formData.noticePeriodStartDate || undefined,
                noticePeriodEndDate: formData.noticePeriodEndDate || undefined,
                // Convert skills string to JSON array
                skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : undefined,
            };

            await employeesApi.create(payload);
            router.push('/hrms/employees');
        } catch (error: any) {
            console.error('Create error:', error);
            setError(error.response?.data?.error || error.message || 'Failed to create employee');
            // Scroll to top to see error
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'basic', label: 'Basic Info' },
        { id: 'personal', label: 'Personal Details' },
        { id: 'address', label: 'Address' },
        { id: 'bank', label: 'Bank & Statutory' },
        { id: 'other', label: 'Other Details' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                                <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                                <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email *</label>
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                            </div>
                            {/* Employee ID is now Auto Generated */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date of Joining *</label>
                                <input type="date" required value={formData.dateOfJoining} onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Department</label>
                                <select value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                                    <option value="">Select Department</option>
                                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Position</label>
                                <select value={formData.positionId} onChange={(e) => setFormData({ ...formData, positionId: e.target.value })} disabled={!formData.departmentId} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100">
                                    <option value="">Select Position</option>
                                    {positions.map(pos => <option key={pos.id} value={pos.id}>{pos.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="on-leave">On Leave</option>
                                    <option value="terminated">Terminated</option>
                                </select>
                            </div>
                        </div>

                        {/* Portal Access Section */}
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-6">
                            <div className="flex items-center mb-4">
                                <input
                                    id="createAccount"
                                    type="checkbox"
                                    checked={formData.createAccount}
                                    onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor="createAccount" className="ml-2 block text-sm text-gray-900 font-medium">
                                    Enable User Portal Access
                                </label>
                            </div>

                            {formData.createAccount && (
                                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Password *</label>
                                        <input
                                            type="text"
                                            required={formData.createAccount}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                            placeholder="Set login password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Assign Role *</label>
                                        <select
                                            required={formData.createAccount}
                                            value={formData.roleId}
                                            onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="">Select Role</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>{role.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2 text-xs text-gray-500">
                                        The user will log in using their email address: <strong>{formData.email || '(enter email above)'}</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'personal':
                return (
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                            <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Gender</label>
                            <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                            <input type="text" value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. O+" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                            <select value={formData.maritalStatus} onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                                <option value="">Select Status</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                            </select>
                        </div>
                    </div>
                );
            case 'address':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Current Address</label>
                            <textarea rows={3} value={formData.currentAddress} onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Permanent Address</label>
                            <textarea rows={3} value={formData.permanentAddress} onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                    </div>
                );
            case 'bank':
                return (
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                            <input type="text" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Account Number</label>
                            <input type="text" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                            <input type="text" value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">PAN Number</label>
                            <input type="text" value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Aadhaar Number</label>
                            <input type="text" value={formData.aadhaarNumber} onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                    </div>
                );
            case 'other':
                return (
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                            <select value={formData.employmentType} onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                                <option value="">Select Type</option>
                                <option value="Full Time">Full Time</option>
                                <option value="Part Time">Part Time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                                <option value="Trainee">Trainee</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                            <input type="number" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
                            <input type="text" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" placeholder="React, Node.js, etc." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Slack Member ID</label>
                            <input type="text" value={formData.slackMemberId} onChange={(e) => setFormData({ ...formData, slackMemberId: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" placeholder="@U12345678" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Probation End Date</label>
                            <input type="date" value={formData.probationEndDate} onChange={(e) => setFormData({ ...formData, probationEndDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notice Period Start</label>
                            <input type="date" value={formData.noticePeriodStartDate} onChange={(e) => setFormData({ ...formData, noticePeriodStartDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notice Period End</label>
                            <input type="date" value={formData.noticePeriodEndDate} onChange={(e) => setFormData({ ...formData, noticePeriodEndDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-0">
            <div className="mb-6">
                <Link href="/hrms/employees" className="text-sm text-gray-500 hover:text-gray-700">
                    ← Back to Employees
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 mt-2">Add New Employee</h1>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            {/* Icon */}
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                {error}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm
                                    ${activeTab === tab.id
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {renderTabContent()}

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                        <Link
                            href="/hrms/employees"
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                        >
                            Cancel
                        </Link>
                        {activeTab !== 'other' && (
                            <button
                                type="button"
                                onClick={() => {
                                    const currIdx = tabs.findIndex(t => t.id === activeTab);
                                    if (currIdx < tabs.length - 1) setActiveTab(tabs[currIdx + 1].id);
                                }}
                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                            >
                                Next
                            </button>
                        )}
                        {activeTab === 'other' && (
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Employee'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
