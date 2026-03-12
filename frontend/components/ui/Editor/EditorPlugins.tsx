'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, PASTE_COMMAND } from 'lexical';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import { $createImageNode } from './ImageNode';
import { useToast } from '@/hooks/useToast';

export function ImagePlugin() {
    const [editor] = useLexicalComposerContext();
    const toast = useToast();
    const pathname = usePathname();
    const isPortal = pathname?.startsWith('/portal');

    useEffect(() => {
        return editor.registerCommand(
            PASTE_COMMAND,
            (event: ClipboardEvent) => {
                const items = event.clipboardData?.items;
                if (!items) return false;

                for (const item of Array.from(items)) {
                    if (item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (file) {
                            uploadAndInsertImage(file);
                            return true; // Prevent default paste behavior
                        }
                    }
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor]);

    // Handle Drag and Drop
    useEffect(() => {
        const handleDrop = async (event: DragEvent) => {
            event.preventDefault();
            const files = event.dataTransfer?.files;
            if (!files) return;

            for (const file of Array.from(files)) {
                if (file.type.startsWith('image/')) {
                    uploadAndInsertImage(file);
                } else {
                    uploadAndInsertFile(file);
                }
            }
        };

        const handleDragOver = (event: DragEvent) => {
            event.preventDefault();
        };

        // We need to attach these to the content editable element
        // Lexical provides a way to get the root element
        const rootElement = editor.getRootElement();
        if (rootElement) {
            rootElement.addEventListener('drop', handleDrop);
            rootElement.addEventListener('dragover', handleDragOver);
            return () => {
                rootElement.removeEventListener('drop', handleDrop);
                rootElement.removeEventListener('dragover', handleDragOver);
            };
        }
    }, [editor]);

    const uploadAndInsertImage = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const endpoint = isPortal ? '/portal/upload/editor-asset' : '/upload/editor-asset';

            // Show uploading toast or indicator?
            const res = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { url } = res.data;

            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    const imageNode = $createImageNode({
                        altText: file.name,
                        src: url,
                        maxWidth: 800
                    });
                    selection.insertNodes([imageNode]);
                }
            });
            toast.success('Image uploaded and inserted');
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Failed to upload image');
        }
    };

    const uploadAndInsertFile = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const endpoint = isPortal ? '/portal/upload/editor-asset' : '/upload/editor-asset';

            const res = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { url, name } = res.data;

            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    // For non-images, we just insert a link for now
                    // Or we could create a FileNode
                    const link = document.createElement('a');
                    link.href = url;
                    link.innerText = `📎 ${name}`;
                    link.target = '_blank';

                    // In Lexical, we should use LinkNode if available or just text with segment
                    selection.insertText(`\n📎 [${name}](${url})\n`);
                }
            });
            toast.success('File uploaded');
        } catch (error) {
            console.error('File upload failed', error);
            toast.error('Failed to upload file');
        }
    };

    return null;
}
