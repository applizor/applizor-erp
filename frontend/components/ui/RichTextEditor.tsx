'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
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
import { $getRoot, $insertNodes, $getSelection, SELECTION_CHANGE_COMMAND, FORMAT_TEXT_COMMAND, COMMAND_PRIORITY_CRITICAL, FORMAT_ELEMENT_COMMAND } from 'lexical';
import { HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TRANSFORMERS } from '@lexical/markdown';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import {
    Bold, Italic, Underline as UnderlineIcon,
    List as ListIcon, ListOrdered, Link as LinkIcon,
    Table as TableIcon, Undo, Redo, MessageSquare,
    AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Quote, Subscript, Superscript
} from 'lucide-react';

// --- THEME & NODES ---
const theme = {
    paragraph: 'mb-2 leading-relaxed text-sm',
    quote: 'border-l-4 border-primary-500 pl-4 italic text-slate-500 my-4 bg-slate-50 py-2 pr-2 rounded-r',
    heading: {
        h1: 'text-2xl font-black text-slate-900 mb-4 mt-6 first:mt-0',
        h2: 'text-xl font-bold text-slate-800 mb-3 mt-5',
        h3: 'text-lg font-bold text-slate-800 mb-2 mt-4',
    },
    list: {
        nested: {
            listitem: 'list-none',
        },
        ol: 'list-decimal ml-5 mb-4 space-y-1',
        ul: 'list-disc ml-5 mb-4 space-y-1',
        listitem: 'pl-1',
    },
    link: 'text-primary-600 underline cursor-pointer hover:text-primary-700',
    text: {
        bold: 'font-bold text-slate-900',
        italic: 'italic',
        underline: 'underline decoration-slate-300 underline-offset-4',
        strikethrough: 'line-through text-slate-400',
        subscript: 'sub',
        superscript: 'super',
        code: 'font-mono bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-600 border border-slate-200',
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
    AutoLinkNode,
    CodeNode,
    CodeHighlightNode,
];

// --- TOOLBAR COMPONENT ---
const Toolbar = ({ onPost }: { onPost?: () => void }) => {
    const [editor] = useLexicalComposerContext();
    const [activeFormats, setActiveFormats] = useState<string[]>([]);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if (selection) {
            // Update active state logic here if needed
        }
    }, [editor]);

    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            () => {
                updateToolbar();
                return false;
            },
            COMMAND_PRIORITY_CRITICAL
        );
    }, [editor, updateToolbar]);

    const format = (cmd: any, value?: any) => editor.dispatchCommand(cmd, value);

    const ToolbarBtn = ({ onClick, icon: Icon, title, active = false }: any) => (
        <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded transition-all ${active ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
        >
            <Icon size={15} strokeWidth={2} />
        </button>
    );

    const Divider = () => <div className="w-px h-4 bg-slate-200 mx-1" />;

    return (
        <div className="flex flex-wrap items-center gap-0.5 p-2 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-0.5">
                <ToolbarBtn onClick={() => format(FORMAT_TEXT_COMMAND, 'bold')} icon={Bold} title="Bold (Ctrl+B)" />
                <ToolbarBtn onClick={() => format(FORMAT_TEXT_COMMAND, 'italic')} icon={Italic} title="Italic (Ctrl+I)" />
                <ToolbarBtn onClick={() => format(FORMAT_TEXT_COMMAND, 'underline')} icon={UnderlineIcon} title="Underline (Ctrl+U)" />
                <ToolbarBtn onClick={() => format(FORMAT_TEXT_COMMAND, 'subscript')} icon={Subscript} title="Subscript" />
                <ToolbarBtn onClick={() => format(FORMAT_TEXT_COMMAND, 'superscript')} icon={Superscript} title="Superscript" />
            </div>

            <Divider />

            <div className="flex items-center gap-0.5">
                <ToolbarBtn onClick={() => editor.update(() => { const selection = $getSelection(); if (selection) $insertNodes([$createHeadingNode('h1')]) })} icon={Heading1} title="Heading 1" />
                <ToolbarBtn onClick={() => editor.update(() => { const selection = $getSelection(); if (selection) $insertNodes([$createHeadingNode('h2')]) })} icon={Heading2} title="Heading 2" />
                <ToolbarBtn onClick={() => editor.update(() => { const selection = $getSelection(); if (selection) $insertNodes([$createQuoteNode()]) })} icon={Quote} title="Quote" />
            </div>

            <Divider />

            <div className="flex items-center gap-0.5">
                <ToolbarBtn onClick={() => format(FORMAT_ELEMENT_COMMAND, 'left')} icon={AlignLeft} title="Align Left" />
                <ToolbarBtn onClick={() => format(FORMAT_ELEMENT_COMMAND, 'center')} icon={AlignCenter} title="Align Center" />
                <ToolbarBtn onClick={() => format(FORMAT_ELEMENT_COMMAND, 'right')} icon={AlignRight} title="Align Right" />
            </div>

            <Divider />

            <div className="flex items-center gap-0.5">
                <ToolbarBtn onClick={() => editor.dispatchCommand(Undo as any, undefined)} icon={Undo} title="Undo (Ctrl+Z)" />
                <ToolbarBtn onClick={() => editor.dispatchCommand(Redo as any, undefined)} icon={Redo} title="Redo (Ctrl+Y)" />
            </div>

            <div className="flex-1" />

            {onPost && (
                <button
                    type="button"
                    onClick={onPost}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded hover:bg-primary-700 transition-colors shadow-sm ml-2 active:translate-y-px"
                >
                    <MessageSquare size={12} fill="white" /> Post
                </button>
            )}
        </div>
    );
};

// --- MAIN EXTERNAL COMPONENT ---
interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    onPost?: () => void;
    placeholder?: string;
    className?: string;
}

const RichTextEditor = forwardRef(({ value, onChange, onPost, placeholder, className }: RichTextEditorProps, ref) => {
    const initialConfig = {
        namespace: 'ApplizorEditor',
        theme,
        nodes: EDITOR_NODES,
        onError: (error: Error) => console.error(error),
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className={`flex flex-col border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-slate-300 transition-colors group/editor h-full ${className}`}>
                <Toolbar onPost={onPost} />
                <div className="relative flex-1 overflow-hidden flex flex-col">
                    <RichTextPlugin
                        contentEditable={
                            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth h-full relative">
                                <ContentEditable className="outline-none min-h-[150px] p-5 text-slate-800 font-medium prose prose-slate max-w-none" />
                            </div>
                        }
                        placeholder={<div className="absolute top-5 left-5 text-slate-300 text-sm pointer-events-none italic select-none">{placeholder || 'Start typing...'}</div>}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <ListPlugin />
                    <LinkPlugin />
                    <TablePlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />

                    <LexicalOnChange htmlOnChange={onChange} />
                    <InitialContentPlugin html={value} />
                    <EditorRefBridge ref={ref} />
                </div>

                {onPost && (
                    <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between shrink-0">
                        <span>Markdown supported</span>
                        <span>Ctrl + Enter to post</span>
                    </div>
                )}
            </div>
        </LexicalComposer>
    );
});

// Helper to bridge Lexical state to HTML
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

// Helper for initial content
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

RichTextEditor.displayName = 'RichTextEditor';
export default RichTextEditor;
