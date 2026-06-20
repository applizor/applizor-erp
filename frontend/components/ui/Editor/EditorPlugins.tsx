'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
    $getSelection, 
    $isRangeSelection, 
    COMMAND_PRIORITY_CRITICAL, 
    PASTE_COMMAND,
    $createParagraphNode,
    $createTextNode,
    $createLineBreakNode,
    LexicalNode
} from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createListNode, $createListItemNode } from '@lexical/list';
import { $createTableNode, $createTableRowNode, $createTableCellNode } from '@lexical/table';
import { $createLinkNode } from '@lexical/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import { $createImageNode } from './ImageNode';
import { useToast } from '@/hooks/useToast';

function importDOMNode(domNode: Node, styles: Record<string, string> = {}): LexicalNode[] {
    const currentStyles = { ...styles };
    if (domNode.nodeType === Node.ELEMENT_NODE) {
        const element = domNode as HTMLElement;
        if (element.style) {
            if (element.style.color) currentStyles['color'] = element.style.color;
            if (element.style.fontSize) currentStyles['font-size'] = element.style.fontSize;
            if (element.style.backgroundColor) currentStyles['background-color'] = element.style.backgroundColor;
            if (element.style.fontFamily) currentStyles['font-family'] = element.style.fontFamily;
        }
    }

    if (domNode.nodeType === Node.TEXT_NODE) {
        const text = domNode.textContent || '';
        if (/^\s*$/.test(text) && text.includes('\n')) {
            return [];
        }
        const textNode = $createTextNode(text);
        const styleString = Object.entries(currentStyles)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ');
        if (styleString) {
            textNode.setStyle(styleString);
        }

        let parent: Node | null = domNode.parentNode;
        let format = 0;
        while (parent) {
            if (parent.nodeType === Node.ELEMENT_NODE) {
                const element = parent as HTMLElement;
                const tagName = element.tagName.toLowerCase();
                if (
                    tagName === 'strong' ||
                    tagName === 'b' ||
                    element.style.fontWeight === 'bold' ||
                    Number(element.style.fontWeight) >= 600
                ) {
                    format |= 1; // Bold
                }
                if (
                    tagName === 'em' ||
                    tagName === 'i' ||
                    element.style.fontStyle === 'italic'
                ) {
                    format |= 2; // Italic
                }
                if (
                    tagName === 'u' ||
                    element.style.textDecoration === 'underline' ||
                    element.style.textDecorationLine === 'underline'
                ) {
                    format |= 8; // Underline
                }
                if (
                    tagName === 'strike' ||
                    tagName === 's' ||
                    tagName === 'del' ||
                    element.style.textDecoration === 'line-through' ||
                    element.style.textDecorationLine === 'line-through'
                ) {
                    format |= 4; // Strikethrough
                }
                if (tagName === 'sub') {
                    format |= 32; // Subscript
                }
                if (tagName === 'sup') {
                    format |= 64; // Superscript
                }
            }
            parent = parent.parentNode;
        }
        if (format > 0) {
            textNode.setFormat(format);
        }
        return [textNode];
    }

    if (domNode.nodeType === Node.ELEMENT_NODE) {
        const element = domNode as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        if (tagName === 'br') {
            return [$createLineBreakNode()];
        }

        if (tagName === 'p') {
            const paragraphNode = $createParagraphNode();
            if (element.style.textAlign) {
                const align = element.style.textAlign.toLowerCase();
                if (['left', 'center', 'right', 'justify'].includes(align)) {
                    paragraphNode.setFormat(align as any);
                }
            }
            const children = Array.from(element.childNodes).flatMap(child =>
                importDOMNode(child, currentStyles)
            );
            paragraphNode.append(...children);
            return [paragraphNode];
        }

        if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
            const headingNode = $createHeadingNode(tagName as any);
            if (element.style.textAlign) {
                const align = element.style.textAlign.toLowerCase();
                if (['left', 'center', 'right', 'justify'].includes(align)) {
                    headingNode.setFormat(align as any);
                }
            }
            const children = Array.from(element.childNodes).flatMap(child =>
                importDOMNode(child, currentStyles)
            );
            headingNode.append(...children);
            return [headingNode];
        }

        if (tagName === 'ul' || tagName === 'ol') {
            const listNode = $createListNode(tagName === 'ol' ? 'number' : 'bullet');
            const children = Array.from(element.childNodes).flatMap(child =>
                importDOMNode(child, currentStyles)
            );
            listNode.append(...children);
            return [listNode];
        }

        if (tagName === 'li') {
            const listItemNode = $createListItemNode();
            const children = Array.from(element.childNodes).flatMap(child =>
                importDOMNode(child, currentStyles)
            );
            listItemNode.append(...children);
            return [listItemNode];
        }

        if (tagName === 'table') {
            const tableNode = $createTableNode();
            const children = Array.from(element.childNodes).flatMap(child =>
                importDOMNode(child, currentStyles)
            );
            tableNode.append(...children);
            return [tableNode];
        }

        if (tagName === 'tr') {
            const tableRowNode = $createTableRowNode();
            const children = Array.from(element.childNodes).flatMap(child =>
                importDOMNode(child, currentStyles)
            );
            tableRowNode.append(...children);
            return [tableRowNode];
        }

        if (tagName === 'td' || tagName === 'th') {
            const tableCellNode = $createTableCellNode(tagName === 'th' ? 1 : 0);
            const children = Array.from(element.childNodes).flatMap(child =>
                importDOMNode(child, currentStyles)
            );
            tableCellNode.append(...children);
            return [tableCellNode];
        }

        if (tagName === 'a') {
            const url = element.getAttribute('href') || '';
            const linkNode = $createLinkNode(url);
            const children = Array.from(element.childNodes).flatMap(child =>
                importDOMNode(child, currentStyles)
            );
            linkNode.append(...children);
            return [linkNode];
        }

        // Default: traverse children
        return Array.from(element.childNodes).flatMap(child =>
            importDOMNode(child, currentStyles)
        );
    }

    return [];
}

export function ImagePlugin() {
    const [editor] = useLexicalComposerContext();
    const toast = useToast();
    const pathname = usePathname();
    const isPortal = pathname?.startsWith('/portal');

    useEffect(() => {
        return editor.registerCommand(
            PASTE_COMMAND,
            (event: ClipboardEvent) => {
                const types = event.clipboardData?.types || [];
                const hasHtml = types.includes('text/html');

                if (hasHtml) {
                    const html = event.clipboardData.getData('text/html');
                    if (html) {
                        event.preventDefault();
                        const parser = new DOMParser();
                        const dom = parser.parseFromString(html, 'text/html');
                        editor.update(() => {
                            const selection = $getSelection();
                            if ($isRangeSelection(selection)) {
                                const nodes = importDOMNode(dom.body);
                                if (nodes.length > 0) {
                                    selection.insertNodes(nodes);
                                }
                            }
                        });
                        return true;
                    }
                }

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
            COMMAND_PRIORITY_CRITICAL
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
