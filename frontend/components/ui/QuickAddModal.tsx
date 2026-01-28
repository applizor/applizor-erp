'use client';

import React, { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string) => Promise<void>;
    title: string;
    label: string;
    placeholder?: string;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    title,
    label,
    placeholder
}) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await onAdd(name.trim());
            setName('');
            onClose();
        } catch (error) {
            console.error('Add failed', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none">
                        {label}
                    </label>
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                    />
                </div>

                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading || !name.trim()}
                        isLoading={loading}
                        className="flex-1"
                    >
                        Add Entry
                    </Button>
                </div>
            </form>
        </Dialog>
    );
};
