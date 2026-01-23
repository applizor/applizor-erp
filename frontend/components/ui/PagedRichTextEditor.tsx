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
                    background: #f8fafc; /* Lighter, cleaner background */
                    padding: 30px 20px;
                    overflow: auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .a4-page-simulation {
                    width: 210mm; /* A4 Width */
                    min-height: 297mm; /* A4 Height */
                    background: white;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                    margin: 0 auto;
                    position: relative;
                    border: 1px solid #e2e8f0;
                }

                /* Quill Overrides for A4 Feel */
                .ql-toolbar {
                    position: sticky;
                    top: 0;
                    z-index: 20;
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
    );
}
