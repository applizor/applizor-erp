'use client';

import React, { useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'jodit/es2021/jodit.min.css';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    const editor = useRef(null);

    const config = useMemo(() => ({
        readonly: false,
        placeholder: placeholder || 'Start typing...',
        toolbarButtonSize: 'middle' as 'middle',
        buttons: [
            'source', '|',
            'bold', 'italic', 'underline', 'strikethrough', 'eraser', '|',
            'ul', 'ol', '|',
            'font', 'fontsize', 'paragraph', 'lineHeight', '|',
            'image', 'table', 'link', '|',
            'align', 'undo', 'redo', '|',
            'hr', 'symbol', 'fullsize', 'print', 'about'
        ],
        uploader: {
            insertImageAsBase64URI: true
        }
    }), [placeholder]);

    return (
        <div className={className}>
            <JoditEditor
                ref={editor}
                value={value}
                config={config}
                onBlur={newContent => onChange(newContent)}
                onChange={newContent => { }}
            />
        </div>
    );
}
