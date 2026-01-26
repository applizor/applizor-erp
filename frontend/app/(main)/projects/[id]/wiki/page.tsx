
'use client';

import { BookOpen, Edit3, Save } from 'lucide-react';
import { useState } from 'react';

export default function ProjectWiki() {
    const [note, setNote] = useState('');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Project Wiki</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Internal Documentation & Notes</p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                    <Save size={14} /> Save Changes
                </button>
            </div>

            <div className="ent-card p-0 overflow-hidden flex flex-col min-h-[500px]">
                <div className="bg-gray-50 border-b border-gray-100 p-2 flex gap-2">
                    <button className="p-2 hover:bg-gray-200 rounded text-gray-600"><strong className="font-serif">B</strong></button>
                    <button className="p-2 hover:bg-gray-200 rounded text-gray-600"><em className="font-serif">I</em></button>
                    <button className="p-2 hover:bg-gray-200 rounded text-gray-600"><span className="underline">U</span></button>
                </div>
                <textarea
                    className="flex-1 w-full p-6 focus:outline-none resize-none"
                    placeholder="Start typing project documentation..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </div>
        </div>
    )
}
