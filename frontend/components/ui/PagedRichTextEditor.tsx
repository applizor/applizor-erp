'use client';

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes, $getSelection, COMMAND_PRIORITY_CRITICAL, FORMAT_TEXT_COMMAND, SELECTION_CHANGE_COMMAND, ParagraphNode, TextNode } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TRANSFORMERS } from '@lexical/markdown';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { Copy, Bold, Italic, Underline as UnderlineIcon, Undo, Redo, FileText, Layout } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

// --- THEME ---
const theme = {
    paragraph: 'mb-0 leading-relaxed min-h-[1em]',
    quote: 'border-l-4 border-slate-200 pl-4 italic text-slate-500 my-2',
    heading: {
        h1: 'text-2xl font-black uppercase tracking-tight mb-4',
        h2: 'text-xl font-bold uppercase tracking-tight mb-3',
    },
    list: {
        ol: 'list-decimal ml-10 mb-4',
        ul: 'list-disc ml-10 mb-4',
        listitem: 'mb-1',
    },
    link: 'text-primary-600 underline cursor-pointer',
    text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
    },
};

const EDITOR_NODES = [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    LinkNode,
    LinkNode,
    AutoLinkNode,
    CodeNode,
    CodeHighlightNode,
];

interface PagedRichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    showLetterhead?: boolean;
    pageOneBg?: string;
    continuationBg?: string;
    continuationBg?: string;
    readOnly?: boolean;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
}

const PagedRichTextEditor = forwardRef(({
    value,
    onChange,
    placeholder,
    className,
    showLetterhead = false,
    pageOneBg,
    continuationBg,
    readOnly = false,
    marginTop = 180,
    marginBottom = 80,
    marginLeft = 40,
    marginRight = 40
}: PagedRichTextEditorProps, ref) => {
    const toast = useToast();

    const initialConfig = {
        namespace: 'ApplizorPagedEditor',
        theme,
        nodes: EDITOR_NODES,
        onError: (error: Error) => console.error(error),
        editable: !readOnly,
    };

    const variables = [
        { label: 'Current Date', value: '[CURRENT_DATE]' },
        { label: 'Contract ID', value: '[CONTRACT_ID]' },
        { label: 'Contract Value', value: '[CONTRACT_VALUE]' },
        { label: 'Currency', value: '[CURRENCY]' },
        { label: 'Valid From', value: '[VALID_FROM]' },
        { label: 'Valid Until', value: '[VALID_UNTIL]' },
        { label: 'Client Name', value: '[CLIENT_NAME]' },
        { label: 'Client Company', value: '[CLIENT_COMPANY]' },
        { label: 'Company Name', value: '[COMPANY_NAME]' },
    ];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${text} copied to clipboard`);
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className={`flex flex-row h-full ${className} bg-slate-50`}>
                {/* Variables Sidebar - Hide in ReadOnly */}
                {!readOnly && (
                    <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 h-[calc(100vh-100px)] sticky top-0">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} className="text-primary-600" /> System Variables
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                            <div className="space-y-1">
                                {variables.map((v) => (
                                    <VariableButton key={v.value} v={v} onCopy={copyToClipboard} />
                                ))}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                            Click to insert context
                        </div>
                    </div>
                )}

                {/* Editor Area */}
                <div className={`flex-1 p-10 overflow-auto flex flex-col items-center no-scrollbar bg-slate-100/50 ${readOnly ? 'items-center justify-center' : ''}`}>
                    {!readOnly && <Toolbar />}
                    <div className={`a4-page-simulation shadow-2xl relative ${!pageOneBg?.toLowerCase().endsWith('.pdf') ? (showLetterhead ? 'with-letterhead' : '') : ''}`}>

                        {/* PDF Letterhead Overlay (Page 1) */}
                        {showLetterhead && pageOneBg?.toLowerCase().endsWith('.pdf') && (
                            <div className="absolute top-0 left-0 w-full h-[297mm] z-0 pointer-events-none overflow-hidden">
                                <object
                                    data={`${pageOneBg}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                    type="application/pdf"
                                    className="w-full h-full object-cover"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    <embed src={`${pageOneBg}#toolbar=0&navpanes=0&scrollbar=0`} type="application/pdf" />
                                </object>
                            </div>
                        )}

                        {/* PDF Letterhead Overlay (Continuation - Simplistic global approach for single-page scrolling view) 
                             Note: The current editor simulates A4 by height but renders as one long scroll 
                             unless paginated. If we want true continuation sheet support for PDF, 
                             we'd need repeating backgrounds which PDF doesn't support easily in this view.
                             For now, we stick to Page 1 being the primary visual for PDF letterheads 
                             or repeat it if forced. 
                             
                             However, standard logic is: Use Page 1 PDF for the whole background if single page?
                             Or if we scroll, the PDF stays static? 
                             The CSS implementation 'with-letterhead:before' was absolute top:0.
                             So the PDF overlay matches that behavior (Page 1 only).
                        */}

                        <RichTextPlugin
                            contentEditable={
                                <ContentEditable
                                    className="lexical-content outline-none min-h-[297mm] w-full bg-transparent z-10 relative"
                                    style={{
                                        padding: showLetterhead
                                            ? `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`
                                            : '20mm 25mm'
                                    }}
                                />
                            }
                            placeholder={<div className="absolute top-[20mm] left-[25mm] text-slate-300 italic pointer-events-none z-10">{placeholder || 'Start typing your document...'}</div>}
                            ErrorBoundary={LexicalErrorBoundary}
                        />
                        <HistoryPlugin />
                        <ListPlugin />
                        <LinkPlugin />
                        <TablePlugin />
                        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                        <InitialContentPlugin html={value} />
                        <LexicalOnChange htmlOnChange={onChange} />

                        {/* Bridge for Ref */}
                        <EditorRefBridge ref={ref} />

                        {/* Visual Page Break Markers */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div
                                    key={i}
                                    className="w-full border-b border-dashed border-slate-100 absolute flex justify-center items-center"
                                    style={{ top: `${i * 297}mm` }}
                                >
                                    <span className="bg-slate-50/80 text-slate-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-slate-100 backdrop-blur-sm">Page {i + 1} Boundary</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .a4-page-simulation {
                    width: 210mm;
                    min-height: 297mm;
                    background: white;
                    margin: 0 auto;
                    position: relative;
                }

                .lexical-content {
                    font-family: 'Inter', system-ui, sans-serif;
                    font-size: 11pt;
                    line-height: 1.6;
                    color: #1a202c;
                }

                /* Letterhead Styles */
                .with-letterhead {
                    background-image: ${continuationBg ? `url('${continuationBg}')` : 'none'};
                    background-size: 100% 297mm;
                    background-repeat: repeat-y;
                    background-position: center top;
                }
                
                .with-letterhead:before {
                    content: "";
                    display: block;
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 297mm;
                    pointer-events: none;
                    background-image: ${pageOneBg ? `url('${pageOneBg}')` : 'none'};
                    background-size: 100% 297mm;
                    background-repeat: no-repeat;
                    z-index: 0;
                }

                .ProseMirror table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 1em 0; }
                .ProseMirror td, .ProseMirror th { border: 1px solid #e2e8f0; padding: 8px 12px; vertical-align: top; }
            `}</style>
        </LexicalComposer>
    );
});

// --- SUB-COMPONENTS ---

function VariableButton({ v, onCopy }: { v: any, onCopy: any }) {
    const [editor] = useLexicalComposerContext();

    const insertVar = () => {
        editor.update(() => {
            const selection = $getSelection();
            if (selection) {
                selection.insertText(v.value);
            }
        });
    };

    return (
        <div className="flex items-center gap-1 group">
            <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={insertVar}
                className="flex-1 text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded transition-all flex items-center justify-between"
            >
                <span>{v.label}</span>
                <code className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded group-hover:bg-primary-100 group-hover:text-primary-500 font-mono">
                    {v.value}
                </code>
            </button>
            <button
                type="button"
                onClick={() => onCopy(v.value)}
                className="p-2 text-slate-300 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
                <Copy size={12} />
            </button>
        </div>
    );
}

const Toolbar = () => {
    const [editor] = useLexicalComposerContext();
    const format = (cmd: any) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, cmd);

    return (
        <div className="w-[210mm] flex items-center gap-1 p-2 bg-white border border-slate-200 rounded-t-xl mb-0 sticky top-0 z-20 shadow-sm">
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => format('bold')} className="p-2 rounded hover:bg-slate-100 text-slate-600 transition-all"><Bold size={16} strokeWidth={2.5} /></button>
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => format('italic')} className="p-2 rounded hover:bg-slate-100 text-slate-600 transition-all"><Italic size={16} strokeWidth={2.5} /></button>
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => format('underline')} className="p-2 rounded hover:bg-slate-100 text-slate-600 transition-all"><UnderlineIcon size={16} strokeWidth={2.5} /></button>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => editor.dispatchCommand(Undo as any, undefined)} className="p-2 rounded hover:bg-slate-100 text-slate-400 transition-all"><Undo size={16} /></button>
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => editor.dispatchCommand(Redo as any, undefined)} className="p-2 rounded hover:bg-slate-100 text-slate-400 transition-all"><Redo size={16} /></button>
        </div>
    );
}

function InitialContentPlugin({ html }: { html: string }) {
    const [editor] = useLexicalComposerContext();
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current && html) {
            isFirstRender.current = false;
            editor.update(() => {
                const parser = new DOMParser();
                const dom = parser.parseFromString(html, 'text/html');
                const nodes = $generateNodesFromDOM(editor, dom);
                $getRoot().clear().append(...nodes);
            });
        }
    }, [editor, html]);

    return null;
}

function LexicalOnChange({ htmlOnChange }: { htmlOnChange: (html: string) => void }) {
    const [editor] = useLexicalComposerContext();
    return (
        <OnChangePlugin onChange={() => {
            editor.getEditorState().read(() => {
                const htmlString = $generateHtmlFromNodes(editor);
                htmlOnChange(htmlString);
            });
        }} />
    );
}

// Helper to expose editor methods via ref
const EditorRefBridge = forwardRef((props, ref) => {
    const [editor] = useLexicalComposerContext();

    useImperativeHandle(ref, () => ({
        insertContent: (text: string) => {
            editor.update(() => {
                const selection = $getSelection();
                if (selection) {
                    selection.insertText(text);
                }
            });
        },
        getHTML: () => {
            let html = '';
            editor.getEditorState().read(() => {
                html = $generateHtmlFromNodes(editor);
            });
            return html;
        }
    }));

    return null;
});

PagedRichTextEditor.displayName = 'PagedRichTextEditor';
export default PagedRichTextEditor;
