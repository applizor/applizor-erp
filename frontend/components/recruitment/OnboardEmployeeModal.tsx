'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { Candidate, OfferLetter } from '@/lib/api/recruitment';
import { departmentsApi, Department, positionsApi, Position } from '@/lib/api/hrms';
import AlertDialog from '@/components/ui/AlertDialog';
import { UserPlus, X, User, Briefcase, Calendar, Shield, Lock } from 'lucide-react';

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
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary-600" />
                        <div>
                            <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase leading-none">Onboard Employee</h3>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">HRMS Intake Protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="h-px bg-gray-100 flex-1"></span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Biographical Data</span>
                            <span className="h-px bg-gray-100 flex-1"></span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">First Name</label>
                                <input type="text" value={formData.firstName} disabled className="ent-input w-full bg-gray-50 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Last Name</label>
                                <input type="text" value={formData.lastName} disabled className="ent-input w-full bg-gray-50 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Email</label>
                                <input type="email" value={formData.email} disabled className="ent-input w-full bg-gray-50 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Phone</label>
                                <input type="text" value={formData.phone} disabled className="ent-input w-full bg-gray-50 text-gray-500 cursor-not-allowed" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="h-px bg-gray-100 flex-1"></span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Employment Configuration</span>
                            <span className="h-px bg-gray-100 flex-1"></span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Employee ID <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. EMP001"
                                    value={formData.employeeId}
                                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                    className="ent-input w-full"
                                />
                            </div>
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Joining Date <span className="text-rose-500">*</span></label>
                                <input
                                    type="date"
                                    required
                                    value={formData.dateOfJoining}
                                    onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })}
                                    className="ent-input w-full"
                                />
                            </div>

                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Department</label>
                                <div className="relative">
                                    <select
                                        value={formData.departmentId}
                                        onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                        className="ent-input w-full appearance-none"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map((d: Department) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Position</label>
                                <div className="relative">
                                    <select
                                        value={formData.positionId}
                                        onChange={e => setFormData({ ...formData, positionId: e.target.value })}
                                        className="ent-input w-full appearance-none"
                                    >
                                        <option value="">Select Position</option>
                                        {positions.filter((p: Position) => !formData.departmentId || p.departmentId === formData.departmentId).map((p: Position) => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Shield size={12} /> Access Credentials Setup
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Password <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="ent-input w-full pl-9"
                                    />
                                </div>
                            </div>
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Confirm Password <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="ent-input w-full pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 bg-primary-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary-950 transition-all shadow-lg shadow-primary-900/10 disabled:opacity-50"
                        >
                            {submitting ? 'Onboarding...' : 'Execute Onboarding'}
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
