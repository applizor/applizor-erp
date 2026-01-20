'use client';

import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
    onSave: (signature: string) => void;
    disabled?: boolean;
}

export default function SignaturePad({ onSave, disabled = false }: SignaturePadProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);

    const clear = () => {
        sigCanvas.current?.clear();
        onSave(''); // Clear the saved signature
    };

    const handleEnd = () => {
        // Automatically save signature when user finishes drawing
        if (!sigCanvas.current?.isEmpty()) {
            const dataURL = sigCanvas.current?.toDataURL();
            if (dataURL) {
                onSave(dataURL);
            }
        }
    };

    return (
        <div className="space-y-3">
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                <SignatureCanvas
                    ref={sigCanvas}
                    onEnd={handleEnd}
                    canvasProps={{
                        className: 'w-full h-40 cursor-crosshair',
                        style: { touchAction: 'none' }
                    }}
                    backgroundColor="white"
                />
            </div>
            <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">Sign above using your mouse or touch screen</p>
                <button
                    type="button"
                    onClick={clear}
                    disabled={disabled}
                    className="text-sm text-gray-600 hover:text-gray-900 underline disabled:opacity-50"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}
