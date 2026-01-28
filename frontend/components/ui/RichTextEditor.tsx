'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'jodit/es2021/jodit.min.css';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

interface MentionItem {
    id: string;
    name: string;
}

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    mentions?: MentionItem[];
}

export default function RichTextEditor({ value, onChange, placeholder, className, mentions }: RichTextEditorProps) {
    const editorRef = useRef<any>(null);
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionCoords, setMentionCoords] = useState<{ top: number, left: number } | null>(null);

    const filteredMentions = useMemo(() => {
        if (mentionSearch === null || !mentions) return [];
        if (mentionSearch === '') return mentions;
        return mentions.filter(m => m.name.toLowerCase().includes(mentionSearch.toLowerCase()));
    }, [mentionSearch, mentions]);

    const insertMention = (mention: MentionItem) => {
        if (!editorRef.current) return;
        const editor = editorRef.current.editor;
        if (!editor || !editor.s) return;

        // We need to replace the @query with the mention
        const selection = editor.s;
        const range = selection.range;
        if (!range) {
            editor.s.insertHTML(`<span class="mention" data-id="${mention.id}" style="color: #4f46e5; font-weight: 800; background: #f5f3ff; padding: 2px 6px; border-radius: 4px; border: 1px solid #ddd6fe; cursor: default;" contenteditable="false">@${mention.name}</span>&nbsp;`);
            setMentionSearch(null);
            return;
        }

        // Find the '@' position to replace it
        const current = typeof selection.current === 'function' ? selection.current() : null;
        if (current && current.nodeType === Node.TEXT_NODE) {
            const text = current.textContent || '';
            const cursor = range.startOffset;
            const lastAt = text.lastIndexOf('@', cursor - 1);

            if (lastAt !== -1) {
                // Set selection to cover the '@' and the search text
                range.setStart(current, lastAt);
                range.setEnd(current, cursor);
                selection.selectRange(range);
            }
        }

        editor.s.insertHTML(`<span class="mention" data-id="${mention.id}" style="color: #4f46e5; font-weight: 800; background: #f5f3ff; padding: 2px 6px; border-radius: 4px; border: 1px solid #ddd6fe; cursor: default;" contenteditable="false">@${mention.name}</span>&nbsp;`);

        setMentionSearch(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (mentionSearch !== null) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMentionIndex(prev => (prev + 1) % (filteredMentions.length || 1));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setMentionIndex(prev => (prev - 1 + (filteredMentions.length || 1)) % (filteredMentions.length || 1));
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                    if (filteredMentions.length > 0) {
                        e.preventDefault();
                        insertMention(filteredMentions[mentionIndex]);
                    }
                } else if (e.key === 'Escape') {
                    setMentionSearch(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [mentionSearch, filteredMentions, mentionIndex]);

    const config = useMemo(() => ({
        readonly: false,
        placeholder: placeholder || 'Start typing...',
        toolbarButtonSize: 'middle' as 'middle',
        zIndex: 0,
        spellcheck: false,
        showCharsCounter: false,
        showWordsCounter: false,
        showXPathInStatusbar: false,
        buttons: [
            'bold', 'italic', 'underline', 'strikethrough', '|',
            'ul', 'ol', '|',
            'font', 'fontsize', 'paragraph', '|',
            'image', 'table', 'link', '|',
            'align', 'undo', 'redo', '|',
            'fullsize', 'about'
        ],
        uploader: {
            insertImageAsBase64URI: true
        },
        events: {
            keyup: (editor: any, e: KeyboardEvent) => {
                if (!editor || !editor.s) return;

                const sel = editor.s;
                const node = typeof sel.current === 'function' ? sel.current() : null;
                if (!node) {
                    setMentionSearch(null);
                    return;
                }

                const text = node.textContent || '';
                const range = sel.range;
                if (!range) {
                    setMentionSearch(null);
                    return;
                }
                const cursor = range.startOffset;

                // Find last '@' before cursor
                const lastAt = text.lastIndexOf('@', cursor - 1);

                if (lastAt !== -1 && (cursor - lastAt) < 20) {
                    const charBeforeAt = lastAt > 0 ? text[lastAt - 1] : ' ';
                    if (/\s/.test(charBeforeAt) || charBeforeAt === '\u00A0') {
                        const search = text.slice(lastAt + 1, cursor);
                        setMentionSearch(search);

                        // Positioning relative to the editor container
                        if (editor.container && typeof editor.container.getBoundingClientRect === 'function') {
                            const containerRect = editor.container.getBoundingClientRect();
                            setMentionCoords({
                                top: containerRect.top + 40,
                                left: containerRect.left + 20
                            });
                        }
                    } else {
                        setMentionSearch(null);
                    }
                } else {
                    setMentionSearch(null);
                }
            },
            click: () => setMentionSearch(null),
            blur: () => setTimeout(() => setMentionSearch(null), 300)
        }
    }), [placeholder, mentions]);

    return (
        <div className={`relative ${className}`}>
            <JoditEditor
                ref={editorRef}
                value={value}
                config={config}
                onBlur={newContent => onChange(newContent)}
                onChange={() => { }}
            />

            {mentionSearch !== null && filteredMentions.length > 0 && (
                <div
                    className="fixed z-[1000000] bg-white border border-slate-200 shadow-2xl rounded-xl w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-t-4 border-t-indigo-500"
                    style={{
                        top: mentionCoords?.top || 0,
                        left: mentionCoords?.left || 0
                    }}
                    onMouseDown={e => e.preventDefault()}
                >
                    <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Member</span>
                        <div className="flex gap-1">
                            <span className="text-[8px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">↑↓</span>
                            <span className="text-[8px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">↵</span>
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-200">
                        {filteredMentions.map((m, i) => (
                            <div
                                key={m.id}
                                onClick={() => insertMention(m)}
                                onMouseEnter={() => setMentionIndex(i)}
                                className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-all ${i === mentionIndex ? 'bg-indigo-600 text-white translate-x-1' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                <div className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-black uppercase ${i === mentionIndex ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                                    {m.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold truncate leading-tight">{m.name}</p>
                                    <p className={`text-[9px] font-bold uppercase tracking-wider ${i === mentionIndex ? 'text-indigo-100' : 'text-slate-400'}`}>@member</p>
                                </div>
                                {i === mentionIndex && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
