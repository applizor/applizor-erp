'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface PagedRichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    showLetterhead?: boolean;
    pageOneBg?: string; // URL for Page 1 Background
    continuationBg?: string; // URL for Continuation Sheet Background
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
    const quillRef = useRef<any>(null);

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['link'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet', 'indent',
        'align', 'link'
    ];

    const insertVariable = (variable: string) => {
        if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            const range = quill.getSelection(true);
            quill.insertText(range.index, variable);
            quill.setSelection(range.index + variable.length);
        }
    };

    const variables = [
        { label: 'Client Name', value: '[CLIENT_NAME]' },
        { label: 'Company Name', value: '[COMPANY_NAME]' },
        { label: 'Website', value: '[WEBSITE]' },
        { label: 'Date', value: '[DATE]' },
        { label: 'Project Name', value: '[PROJECT_NAME]' },
        { label: 'Total Amount', value: '[TOTAL_AMOUNT]' },
        { label: 'Client Signature', value: '[CLIENT_SIGNATURE]' },
        { label: 'Company Signature', value: '[COMPANY_SIGNATURE]' },
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
                            <button
                                key={v.value}
                                onClick={() => insertVariable(v.value)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded transition-colors flex items-center justify-between group"
                            >
                                <span>{v.label}</span>
                                <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded group-hover:bg-indigo-100 group-hover:text-indigo-500 font-mono">
                                    {v.value}
                                </code>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                    Click to insert variable at cursor position.
                </div>
            </div>

            {/* Editor Area */}
            <div className={`paged-editor-container flex-1`}>
                {/* A4 Page Simulation Wrapper */}
                <div className={`a4-page-simulation ${showLetterhead ? 'with-letterhead' : ''}`}>
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={value}
                        onChange={onChange}
                        modules={modules}
                        formats={formats}
                        placeholder={placeholder}
                        className="bg-white"
                    />

                    {/* Visual Page Break Markers */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                        {/* Page 1 Break Line (approx 297mm - margins) - Visual Guide Only */}
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
                        background: #f8fafc; /* Lighter, cleaner background */
                        padding: 30px 40px;
                        overflow: auto;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        height: calc(100vh - 80px); /* Fill remaining height */
                    }

                    .a4-page-simulation {
                        width: 210mm; /* A4 Width */
                        min-height: 297mm; /* A4 Height */
                        background: white;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                        margin: 0 auto;
                        position: relative;
                        border: 1px solid #e2e8f0;
                        padding-bottom: 50px; /* Space for last page growth */
                    }

                    /* Quill Overrides for A4 Feel */
                    .ql-toolbar {
                        position: sticky;
                        top: 0;
                        z-index: 50;
                        background: white;
                        border: none !important;
                        border-bottom: 1px solid #e2e8f0 !important;
                        width: 100%;
                        margin-bottom: 0;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                        display: flex;
                        justify-content: center;
                        flex-wrap: wrap;
                        padding: 8px !important;
                    }

                    .ql-container {
                        border: none !important;
                        font-size: 11pt; /* Standard Document Font Size */
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    }

                    .ql-editor {
                        min-height: 297mm;
                        padding: 30mm 25mm !important; /* Professional Margins */
                        line-height: 1.6;
                        color: #1e293b;
                    }

                    /* Letterhead Styles */
                    .with-letterhead .ql-editor {
                         background-image: ${continuationBg ? `url('${continuationBg}')` : 'none'};
                         background-size: 100% 100%;
                         background-repeat: no-repeat;
                         background-position: center;
                    }
                    
                     .with-letterhead .ql-editor:before {
                         content: "";
                         display: block;
                         position: absolute;
                         top: 0;
                         left: 0;
                         right: 0;
                         height: 100%;
                         pointer-events: none;
                         background-image: ${pageOneBg ? `url('${pageOneBg}')` : 'none'};
                         background-size: 100% 100%;
                         background-repeat: no-repeat;
                         opacity: 1;
                         z-index: 0;
                     }
                     
                     .ql-editor > * {
                         position: relative;
                         z-index: 1;
                     }

                `}</style>
            </div>
        </div>
    );
}
