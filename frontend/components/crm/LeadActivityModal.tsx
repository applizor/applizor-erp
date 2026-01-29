'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface LeadActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    leadId: string;
    defaultType?: string; // 'call', 'email', 'note', 'meeting'
}

export default function LeadActivityModal({ isOpen, onClose, onSuccess, leadId, defaultType = 'note' }: LeadActivityModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: defaultType,
        title: '',
        description: '',
        outcome: '' // useful for calls
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post(`/leads/${leadId}/activities`, formData);
            toast.success('Activity logged successfully');
            // Reset form
            setFormData({ type: 'note', title: '', description: '', outcome: '' });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to log activity');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                        <button
                            onClick={onClose}
                            type="button"
                            className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start">
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                Log Activity
                            </h3>

                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Activity Type</label>
                                    <CustomSelect
                                        value={formData.type}
                                        onChange={(val) => setFormData({ ...formData, type: val })}
                                        options={[
                                            { label: 'Phone Call', value: 'call' },
                                            { label: 'Email', value: 'email' },
                                            { label: 'Meeting', value: 'meeting' },
                                            { label: 'Note', value: 'note' }
                                        ]}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        id="title"
                                        required
                                        placeholder="e.g. Discussed pricing"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                {formData.type === 'call' && (
                                    <div>
                                        <label htmlFor="outcome" className="block text-sm font-medium text-gray-700">Outcome</label>
                                        <CustomSelect
                                            value={formData.outcome}
                                            onChange={(val) => setFormData({ ...formData, outcome: val })}
                                            options={[
                                                { label: 'Select Outcome...', value: '' },
                                                { label: 'Connected', value: 'connected' },
                                                { label: 'Left Message', value: 'left_message' },
                                                { label: 'No Answer', value: 'no_answer' },
                                                { label: 'Wrong Number', value: 'wrong_number' }
                                            ]}
                                            placeholder="Select Outcome..."
                                            className="w-full"
                                        />
                                    </div>
                                )}

                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : 'Log Activity'}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
