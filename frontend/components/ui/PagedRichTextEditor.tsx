'use client';

import React, { useRef, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import 'jodit/es2021/jodit.min.css';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

interface PagedRichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    showLetterhead?: boolean;
    pageOneBg?: string;
    continuationBg?: string;
}

export default function PagedRichTextEditor({
    value,
    onChange,
    placeholder,
    className,
    showLetterhead = false,
    pageOneBg,
    continuationBg
}: PagedRichTextEditorProps) {
    const editorRef = useRef<any>(null);
    const toast = useToast();

    const config = useMemo(() => ({
        readonly: false,
        placeholder: placeholder || 'Start typing...',
        height: 'auto',
        minHeight: 1123, // A4 approx height
        width: '210mm',
        toolbarAdaptive: false,
        toolbarSticky: true,
        toolbarButtonSize: 'middle' as 'middle',
        buttons: [
            'source', '|',
            'bold', 'italic', 'underline', 'strikethrough', 'eraser', '|',
            'ul', 'ol', '|',
            'font', 'fontsize', 'paragraph', 'lineHeight', '|',
            'image', 'table', 'link', '|',
            'align', 'undo', 'redo', '|',
            'hr', 'symbol', 'fullsize', 'print'
        ],
        style: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '11pt',
            lineHeight: '1.6',
            color: '#1e293b',
            padding: '20mm 25mm',
            background: 'transparent'
        },
        uploader: {
            insertImageAsBase64URI: true
        }
    }), [placeholder]);

    const insertVariable = (variable: string) => {
        if (editorRef.current && editorRef.current.editor) {
            editorRef.current.editor.selection.insertHTML(variable);
            // After insertion, manually trigger onChange if needed, 
            // but Jodit's internal state usually syncs on next interaction or we can force it
            const newContent = editorRef.current.editor.value;
            onChange(newContent);
        } else {
            console.warn("Editor not initialized yet");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${text} copied to clipboard`);
    };

    const variables = [
        // System / Contract
        { label: 'Current Date', value: '[CURRENT_DATE]' },
        { label: 'Contract ID', value: '[CONTRACT_ID]' },
        { label: 'Contract Value', value: '[CONTRACT_VALUE]' },
        { label: 'Currency', value: '[CURRENCY]' },
        { label: 'Valid From', value: '[VALID_FROM]' },
        { label: 'Valid Until', value: '[VALID_UNTIL]' },

        // Client Details
        { label: 'Client Name', value: '[CLIENT_NAME]' },
        { label: 'Client Company', value: '[CLIENT_COMPANY]' },
        { label: 'Client Email', value: '[CLIENT_EMAIL]' },
        { label: 'Client Phone', value: '[CLIENT_PHONE]' },
        { label: 'Client Address', value: '[CLIENT_ADDRESS]' },
        { label: 'Client City', value: '[CLIENT_CITY]' },
        { label: 'Client State', value: '[CLIENT_STATE]' },
        { label: 'Client GSTIN', value: '[CLIENT_GSTIN]' },
        { label: 'Client PAN', value: '[CLIENT_PAN]' },
        { label: 'Client Signature', value: '[CLIENT_SIGNATURE]' },

        // Company Details
        { label: 'Company Name', value: '[COMPANY_NAME]' },
        { label: 'Company Legal Name', value: '[COMPANY_LEGAL_NAME]' },
        { label: 'Company Email', value: '[COMPANY_EMAIL]' },
        { label: 'Company Phone', value: '[COMPANY_PHONE]' },
        { label: 'Company Address', value: '[COMPANY_ADDRESS]' },
        { label: 'Company GSTIN', value: '[COMPANY_GSTIN]' },
        { label: 'Company PAN', value: '[COMPANY_PAN]' },
        { label: 'Company Signature', value: '[COMPANY_SIGNATURE]' },

        // Project Details
        { label: 'Project Name', value: '[PROJECT_NAME]' },
        { label: 'Project Description', value: '[PROJECT_DESCRIPTION]' },
        { label: 'Project Start Date', value: '[PROJECT_START_DATE]' },
        { label: 'Project End Date', value: '[PROJECT_END_DATE]' },
    ];

    return (
        <div className={`flex flex-row h-full ${className}`}>
            {/* Variables Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-10 h-[calc(100vh-100px)] sticky top-0">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Variables</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-1">
                        {variables.map((v) => (
                            <div key={v.value} className="flex items-center gap-1 group">
                                <button
                                    type="button"
                                    onClick={() => insertVariable(v.value)}
                                    className="flex-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded transition-colors flex items-center justify-between"
                                    title="Insert at cursor"
                                >
                                    <span>{v.label}</span>
                                    <code className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded group-hover:bg-indigo-100 group-hover:text-indigo-500 font-mono">
                                        {v.value}
                                    </code>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(v.value)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Copy to clipboard"
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-500 text-center leading-relaxed">
                    Click to insert • Hover for copy option
                </div>
            </div>

            {/* Editor Area */}
            <div className="paged-editor-container flex-1">
                <div className={`a4-page-simulation ${showLetterhead ? 'with-letterhead' : ''}`}>
                    <JoditEditor
                        ref={editorRef}
                        value={value}
                        config={config}
                        onBlur={newContent => onChange(newContent)}
                        onChange={newContent => { }}
                    />

                    {/* Visual Page Break Markers */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-[1]">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                className="w-full border-b-2 border-dashed border-gray-200 absolute flex justify-center items-center"
                                style={{ top: `${i * 297}mm` }}
                            >
                                <span className="bg-gray-100 text-gray-400 text-[10px] px-2 rounded-full">Page {i + 1} Start</span>
                            </div>
                        ))}
                    </div>
                </div>

                <style jsx global>{`
                    .paged-editor-container {
                        background: #f8fafc;
                        padding: 30px 40px;
                        overflow: auto;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        height: calc(100vh - 80px);
                    }

                    .a4-page-simulation {
                        width: 210mm;
                        min-height: 297mm;
                        background: white;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                        margin: 0 auto;
                        position: relative;
                        padding-bottom: 50px;
                    }

                    .jodit-container {
                        border: none !important;
                        min-height: 297mm !important;
                        width: 100% !important;
                    }

                    .jodit-workplace {
                        min-height: 297mm !important;
                    }

                    .jodit-wysiwyg {
                        padding: 0 !important; /* Managed by style config */
                        background: transparent !important;
                    }

                    /* Letterhead Styles */
                     .with-letterhead {
                          background-image: ${continuationBg ? `url('${continuationBg}')` : 'none'};
                          background-size: 100% 100%;
                          background-repeat: no-repeat;
                          background-position: center;
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
                          background-size: 100% 100%;
                          background-repeat: no-repeat;
                          opacity: 1;
                          z-index: 0;
                      }
                `}</style>
            </div>
        </div>
    );
}
