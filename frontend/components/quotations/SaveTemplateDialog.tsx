import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SaveTemplateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    templateName: string;
    setTemplateName: (name: string) => void;
    templateCategory: string;
    setTemplateCategory: (category: string) => void;
}

export default function SaveTemplateDialog({
    isOpen,
    onClose,
    onSave,
    templateName,
    setTemplateName,
    templateCategory,
    setTemplateCategory
}: SaveTemplateDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-md text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-50 sm:mx-0 sm:h-10 sm:w-10">
                                <Copy className="h-5 w-5 text-primary-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-bold text-gray-900 uppercase tracking-tight" id="modal-title">
                                    Save Template Configuration
                                </h3>
                                <div className="mt-4 space-y-4">
                                    <p className="text-sm text-gray-500">
                                        Persist this proposal structure as a reusable template for future operations.
                                    </p>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Template Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                            className="ent-input w-full"
                                            placeholder="e.g. Website Development Standard"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Category Tag (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={templateCategory}
                                            onChange={(e) => setTemplateCategory(e.target.value)}
                                            className="ent-input w-full"
                                            placeholder="e.g. Software Services"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                        <Button
                            type="button"
                            onClick={onSave}
                            className="w-full sm:w-auto text-sm"
                            variant="primary"
                        >
                            Confirm Save
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="w-full sm:w-auto text-sm mt-3 sm:mt-0"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
