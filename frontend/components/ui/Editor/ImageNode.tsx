import {
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
    DecoratorNode,
    DOMExportOutput,
    LexicalEditor,
} from 'lexical';
import React, { Suspense } from 'react';

export interface SerializedImageNode extends SerializedLexicalNode {
    altText: string;
    height?: number;
    maxWidth: number;
    showCaption: boolean;
    src: string;
    width?: number;
}

export class ImageNode extends DecoratorNode<React.JSX.Element> {
    __src: string;
    __altText: string;
    __width: 'inherit' | number;
    __height: 'inherit' | number;
    __maxWidth: number;
    __showCaption: boolean;

    static getType(): string {
        return 'image';
    }

    static clone(node: ImageNode): ImageNode {
        return new ImageNode(
            node.__src,
            node.__altText,
            node.__maxWidth,
            node.__width,
            node.__height,
            node.__showCaption,
            node.__key,
        );
    }

    constructor(
        src: string,
        altText: string,
        maxWidth: number,
        width?: 'inherit' | number,
        height?: 'inherit' | number,
        showCaption?: boolean,
        key?: NodeKey,
    ) {
        super(key);
        this.__src = src;
        this.__altText = altText;
        this.__maxWidth = maxWidth;
        this.__width = width || 'inherit';
        this.__height = height || 'inherit';
        this.__showCaption = showCaption || false;
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('img');
        element.setAttribute('src', this.__src);
        element.setAttribute('alt', this.__altText);
        element.setAttribute('width', this.__width.toString());
        element.setAttribute('height', this.__height.toString());
        return { element };
    }

    static importJSON(serializedNode: SerializedImageNode): ImageNode {
        const { altText, height, maxWidth, showCaption, src, width } = serializedNode;
        const node = $createImageNode({
            altText,
            height,
            maxWidth,
            showCaption,
            src,
            width,
        });
        return node;
    }

    exportJSON(): SerializedImageNode {
        return {
            altText: this.__altText,
            height: this.__height === 'inherit' ? 0 : this.__height,
            maxWidth: this.__maxWidth,
            showCaption: this.__showCaption,
            src: this.__src,
            type: 'image',
            version: 1,
            width: this.__width === 'inherit' ? 0 : this.__width,
        };
    }

    createDOM(config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        const theme = config.theme;
        const className = theme.image;
        if (className !== undefined) {
            span.className = className;
        }
        return span;
    }

    updateDOM(): false {
        return false;
    }

    decorate(): React.JSX.Element {
        return (
            <div className="relative inline-block max-w-full my-4 rounded-lg overflow-hidden border border-slate-200 shadow-sm transition-transform hover:scale-[1.01]">
                <img
                    src={this.__src}
                    alt={this.__altText}
                    style={{
                        width: this.__width,
                        height: this.__height,
                        maxWidth: '100%',
                    }}
                    className="block"
                />
            </div>
        );
    }
}

export function $createImageNode({
    altText,
    height,
    maxWidth = 500,
    src,
    width,
    showCaption,
    key,
}: {
    altText: string;
    height?: number;
    maxWidth?: number;
    showCaption?: boolean;
    src: string;
    width?: number;
    key?: NodeKey;
}): ImageNode {
    return new ImageNode(
        src,
        altText,
        maxWidth,
        width,
        height,
        showCaption,
        key,
    );
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
    return node instanceof ImageNode;
}
