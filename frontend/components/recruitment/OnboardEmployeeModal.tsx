'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { Candidate, OfferLetter } from '@/lib/api/recruitment';
import { departmentsApi, Department, positionsApi, Position } from '@/lib/api/hrms';
import AlertDialog from '@/components/ui/AlertDialog';

interface OnboardEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    candidate: Candidate;
    offer: OfferLetter | null;
}

export default function OnboardEmployeeModal({ isOpen, onClose, onSubmit, candidate, offer }: OnboardEmployeeModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);

    // Alert dialog state
    const [alertDialog, setAlertDialog] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title?: string;
        message: string;
    }>({ isOpen: false, type: 'info', message: '' });

    const [formData, setFormData] = useState({
        employeeId: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        departmentId: '',
        positionId: '',
        dateOfJoining: '',
        candidateId: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadMetaData();
            // Pre-fill data
            setFormData(prev => ({
                ...prev,
                firstName: candidate.firstName,
                lastName: candidate.lastName,
                email: candidate.email,
                phone: candidate.phone,
                candidateId: candidate.id,
                dateOfJoining: offer?.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            }));
        }
    }, [isOpen, candidate, offer]);

    const loadMetaData = async () => {
        try {
            const [depts, pos] = await Promise.all([
                departmentsApi.getAll(),
                positionsApi.getAll()
            ]);
            setDepartments(depts);
            setPositions(pos);

            // smart match department
            if (offer?.department) {
                const matchedDept = depts.find(d => d.name.toLowerCase() === offer.department.toLowerCase());
                if (matchedDept) {
                    setFormData(prev => ({ ...prev, departmentId: matchedDept.id }));
                }
            }
        } catch (error) {
            console.error('Failed to load metadata', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Password Mismatch',
                message: 'Passwords do not match'
            });
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit({
                ...formData,
                status: 'active'
            });
            onClose();
        } catch (error) {
            console.error('Failed to onboard:', error);
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Onboarding Failed',
                message: 'Failed to onboard employee. Please check inputs.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full m-4">
                <div className="flex justify-between items-center p-5 border-b">
                    <h3 className="text-xl font-medium text-gray-900">Onboard Employee</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Personal Info (Read Only mostly) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input type="text" value={formData.firstName} disabled className="mt-1 block w-full bg-gray-100 px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input type="text" value={formData.lastName} disabled className="mt-1 block w-full bg-gray-100 px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" value={formData.email} disabled className="mt-1 block w-full bg-gray-100 px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input type="text" value={formData.phone} disabled className="mt-1 block w-full bg-gray-100 px-3 py-2 border border-gray-300 rounded-md" />
                        </div>

                        {/* Employment Details */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Employee ID <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. EMP001"
                                value={formData.employeeId}
                                onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Joining Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                required
                                value={formData.dateOfJoining}
                                onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <select
                                value={formData.departmentId}
                                onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Select Department</option>
                                {departments.map((d: Department) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Position</label>
                            <select
                                value={formData.positionId}
                                onChange={e => setFormData({ ...formData, positionId: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Select Position</option>
                                {positions.filter((p: Position) => !formData.departmentId || p.departmentId === formData.departmentId).map((p: Position) => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">User Account Setup</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            {submitting ? 'Onboarding...' : 'Create Employee & User'}
                        </button>
                    </div>
                </form>

                {/* Alert Dialog */}
                <AlertDialog
                    isOpen={alertDialog.isOpen}
                    onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
                    type={alertDialog.type}
                    title={alertDialog.title}
                    message={alertDialog.message}
                />
            </div>
        </div>
    );
}
