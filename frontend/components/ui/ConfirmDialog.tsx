
'use client';

import React from 'react';
import { Dialog } from './Dialog';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false
}) => {

    const getIcon = () => {
        switch (type) {
            case 'danger': return <div className="p-3 bg-red-100 rounded-full text-red-600"><AlertTriangle size={24} /></div>;
            case 'warning': return <div className="p-3 bg-amber-100 rounded-full text-amber-600"><AlertTriangle size={24} /></div>;
            case 'success': return <div className="p-3 bg-green-100 rounded-full text-green-600"><CheckCircle size={24} /></div>;
            default: return <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Info size={24} /></div>;
        }
    };

    const getButtonClass = () => {
        switch (type) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'warning': return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
            case 'success': return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
            default: return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
            <div className="flex flex-col items-center text-center space-y-4">
                {getIcon()}

                <div className="space-y-2">
                    <p className="text-gray-600 leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="flex w-full space-x-3 pt-4">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-all shadow-md focus:ring-2 focus:ring-offset-2 ${getButtonClass()} ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </Dialog>
    );
};
