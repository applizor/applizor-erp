'use client';

import { useState } from 'react';
import { DollarSign, X, Briefcase, Calendar, Building } from 'lucide-react';

interface OfferLetterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    candidateName: string;
}

export default function OfferLetterModal({ isOpen, onClose, onSubmit, candidateName }: OfferLetterModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        position: '',
        department: '',
        salary: '',
        startDate: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Failed to generate offer:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <div>
                            <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase leading-none">Generate Offer</h3>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Compensation Proposal</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-3 bg-emerald-50/50 border-b border-emerald-100/50 text-center">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                        Target Recipient: <span className="font-black">{candidateName}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="ent-form-group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block flex items-center gap-1">
                            <Briefcase size={10} /> Position Title
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="ent-input w-full"
                            placeholder="EX: SENIOR ENGINEER"
                        />
                    </div>
                    <div className="ent-form-group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block flex items-center gap-1">
                            <Building size={10} /> Department
                        </label>
                        <input
                            type="text"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="ent-input w-full"
                            placeholder="EX: PRODUCT DEVELOPMENT"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="ent-form-group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block flex items-center gap-1">
                                <DollarSign size={10} /> Annual CTC
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.salary}
                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                className="ent-input w-full"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block flex items-center gap-1">
                                <Calendar size={10} /> Joining Date
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="ent-input w-full"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
                            className="px-5 py-2 bg-emerald-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10 disabled:opacity-50"
                        >
                            {submitting ? 'Generating...' : 'Confirm Proposal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
