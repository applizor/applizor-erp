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

    return (
        <div className={`paged-editor-container ${className}`}>
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
            </div>

            <style jsx global>{`
                .paged-editor-container {
                    background: #dfe3e8; /* Grey background like Word/Docs */
                    padding: 40px;
                    overflow: auto;
                    display: flex;
                    justify-content: center;
                }

                .a4-page-simulation {
                    width: 210mm; /* A4 Width */
                    min-height: 297mm; /* A4 Height */
                    background: white;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    margin: 0 auto;
                    position: relative;
                }

                /* Quill Overrides for A4 Feel */
                .ql-toolbar {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    background: white;
                    border: 1px solid #e2e8f0 !important;
                    width: 210mm;
                    margin: 0 auto 10px auto;
                    border-radius: 6px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .ql-container {
                    border: none !important;
                    font-size: 11pt; /* Standard Document Font Size */
                    font-family: 'Times New Roman', Times, serif; /* Legal standard */
                }

                .ql-editor {
                    min-height: 297mm;
                    padding: 25mm 20mm; /* Standard Margins */
                    line-height: 1.5;
                }

                /* Letterhead Styles */
                .with-letterhead .ql-editor {
                    /* Default to Continuation Sheet for generic background */
                     background-image: ${continuationBg ? `url('${continuationBg}')` : 'none'};
                     background-size: 100% auto;
                     background-repeat: repeat-y;
                     background-position: top center;
                }
                
                /* Page 1 Specific - difficult in single editor, but we can fake top margin or background attachment */
                 .with-letterhead .ql-editor:before {
                     /* This is pseudo-code for visual aid, real multi-page requires splitting content */
                     /* For MVP, we apply one background or assume header is consistent */
                     content: "";
                     display: block;
                     position: absolute;
                     top: 0;
                     left: 0;
                     right: 0;
                     height: 297mm;
                     pointer-events: none;
                     background-image: ${pageOneBg ? `url('${pageOneBg}')` : 'none'};
                     background-size: cover;
                     opacity: 1;
                     z-index: 0;
                     /* Only show on first "page" area? Hard with scrolling text. */
                     /* User requested strict separation. True separation needs separate text areas per page, which is very hard for editing flow. */
                     /* We will try to simulate a continuous sheet with the continuation header repeating */
                 }
                 
                 /* Ensure text is above background */
                 .ql-editor > * {
                     position: relative;
                     z-index: 1;
                 }

            `}</style>
        </div>
    );
}
