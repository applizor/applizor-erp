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
    onPost?: () => void;
    placeholder?: string;
    className?: string;
    mentions?: MentionItem[];
    showSuggestions?: boolean;
}

export default function RichTextEditor({ value, onChange, onPost, placeholder, className, mentions, showSuggestions = true }: RichTextEditorProps) {
    const editorRef = useRef<any>(null);
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionCoords, setMentionCoords] = useState<{ top: number, left: number } | null>(null);

    const filteredMentions = useMemo(() => {
        if (mentionSearch === null || !mentions) return [];
        if (mentionSearch === '') return mentions;
        return mentions.filter(m => m.name.toLowerCase().includes(mentionSearch.toLowerCase()));
    }, [mentionSearch, mentions]);

    const suggestions = [
        { label: 'Looks good!', emoji: '🎉' },
        { label: 'Need help?', emoji: '👋' },
        { label: 'This is blocked...', emoji: '⛔' }
    ];

    const insertSuggestion = (suggestion: string) => {
        if (!editorRef.current) return;
        const editor = editorRef.current.editor;
        editor.s.insertHTML(`<p>${suggestion}</p>`);
        onChange(editor.value);
    };

    const insertMention = (mention: MentionItem) => {
        if (!editorRef.current) return;
        const editor = editorRef.current.editor;
        if (!editor || !editor.s) return;

        // We need to replace the @query with the mention
        const selection = editor.s;
        const range = selection.range;

        // JIRA Style Mention: Blue background, white text, pill shape
        const mentionHtml = `<span class="mention" data-id="${mention.id}" style="color: #ffffff; font-weight: 700; background: #0052cc; padding: 2px 8px; border-radius: 12px; cursor: default; font-size: 0.9em;" contenteditable="false">@${mention.name}</span>&nbsp;`;

        if (!range) {
            editor.s.insertHTML(mentionHtml);
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

        editor.s.insertHTML(mentionHtml);
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
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (onPost) {
                    e.preventDefault();
                    onPost();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [mentionSearch, filteredMentions, mentionIndex, onPost]);

    const config = useMemo(() => ({
        readonly: false,
        placeholder: placeholder || 'Add a comment...',
        toolbarButtonSize: 'middle' as 'middle',
        zIndex: 0,
        spellcheck: false,
        showCharsCounter: false,
        showWordsCounter: false,
        showXPathInStatusbar: false,
        theme: 'default',
        style: {
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif'
        },
        buttons: [
            'bold', 'italic', 'underline', 'strikethrough', '|',
            'ul', 'ol', '|',
            'font', 'fontsize', 'paragraph', '|',
            'image', 'table', 'link', '|',
            'align', 'undo', 'redo', '|',
            'fullsize'
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

                        // Positioning
                        if (editor.container) {
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
        <div id="rich-text-editor-container" className={`relative ${className} group/editor`}>
            {showSuggestions && !value.trim() && (
                <div className="absolute top-10 left-12 z-10 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    {suggestions.map(s => (
                        <button
                            key={s.label}
                            onClick={() => insertSuggestion(s.label)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <span>{s.emoji}</span> {s.label}
                        </button>
                    ))}
                </div>
            )}

            <JoditEditor
                ref={editorRef}
                value={value}
                config={config}
                onBlur={newContent => onChange(newContent)}
                onChange={() => { }}
            />

            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50/50 rounded-b-lg">
                <p className="text-[10px] text-slate-400 font-medium">
                    Pro tip: press <kbd className="bg-white border border-slate-200 px-1 rounded shadow-sm text-slate-600 font-bold uppercase">M</kbd> to comment
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest hidden group-focus-within/editor:block animate-in fade-in">
                        Cmd + Enter to post
                    </span>
                </div>
            </div>

            {mentionSearch !== null && filteredMentions.length > 0 && (
                <div
                    className="fixed z-[1000] bg-white border border-slate-200 shadow-2xl rounded-xl w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-t-4 border-t-indigo-500"
                    style={{
                        top: (mentionCoords?.top || 0) + 20,
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
