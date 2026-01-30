'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, Download, FileText, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PagedRichTextEditor from '@/components/ui/PagedRichTextEditor';
import { Switch } from '@/components/ui/Switch';
import Portal from '@/components/ui/Portal';

import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';

interface DocumentPreviewModalProps {
    templateId: string;
    employeeId: string;
    onClose: () => void;
    onPublished: () => void;
}

export default function DocumentPreviewModal({ templateId, employeeId, onClose, onPublished }: DocumentPreviewModalProps) {
    const toast = useToast();
    const [html, setHtml] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);

    // UI State
    const [useLetterhead, setUseLetterhead] = useState(true);
    const [zoom, setZoom] = useState(0.85); // Start at reasonable view scale for A4 on standard screens

    // Data State
    const [companyData, setCompanyData] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            await Promise.all([
                loadPreview(),
                fetchCompanyData()
            ]);
        };
        init();
    }, [templateId, employeeId]);

    const fetchCompanyData = async () => {
        try {
            const res = await api.get('/company');
            setCompanyData(res.data.company);
        } catch (error) {
            console.error('Failed to fetch company settings', error);
            // Don't show toast for this background task to avoid clutter, 
            // modal will just gracefully degrade to plain paper if failed.
        }
    };

    const loadPreview = async () => {
        try {
            setLoading(true);
            const res = await api.post('/documents/preview', {
                templateId,
                employeeId,
                useLetterhead // Pass just in case backend logic needs it
            });
            setHtml(res.data.html);
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to load preview');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        try {
            setPublishing(true);
            const res = await api.post('/documents/publish', {
                templateId,
                employeeId,
                useLetterhead
            });

            toast.success('Document published successfully');
            onPublished();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to publish document');
        } finally {
            setPublishing(false);
        }
    };


    // Helper to constructing full Image URL
    const getImageUrl = (path: string | null | undefined) => {
        if (!path) return null; // Or return a verified default if we had one
        if (path.startsWith('http')) return path;
        if (path.startsWith('/uploads')) {
            // Use environment variable or default to localhost:5000 (standard for this project)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            // If api url ends with /api, strip it to get base url
            const baseUrl = apiUrl.replace(/\/api$/, '');
            return `${baseUrl}${path}`;
        }
        return path;
    };

    // Determine letterhead images based on Company data
    // Note: We don't use the hardcoded '/images/letterhead-page1.png' fallback anymore 
    // because those files don't exist in the project, leading to broken images.
    const pageOneBg = getImageUrl(companyData?.letterhead);
    const continuationBg = getImageUrl(companyData?.continuationSheet);

    return (
        <Portal>
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col animate-in fade-in zoom-in duration-300 border border-slate-200 overflow-hidden">

                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/80 backdrop-blur-md sticky top-0 z-50">
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="p-2.5 bg-primary-900 text-white rounded-lg shadow-lg shadow-primary-900/20">
                                <FileText size={20} strokeWidth={2.5} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none truncate">Document Preview</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 truncate">Review Content & Layout</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 flex-shrink-0">
                            {/* Zoom Controls */}
                            <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                                <button
                                    onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                    title="Zoom Out"
                                >
                                    <ZoomOut size={16} />
                                </button>
                                <span className="text-[10px] font-bold text-slate-500 w-12 text-center select-none">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                    title="Zoom In"
                                >
                                    <ZoomIn size={16} />
                                </button>
                            </div>

                            {/* Letterhead Toggle */}
                            <div className="flex items-center gap-3 bg-white pl-4 pr-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                                <span className={`text-[10px] font-black uppercase tracking-wider ${useLetterhead ? 'text-slate-800' : 'text-slate-400'}`}>
                                    Letterhead
                                </span>
                                <Switch
                                    checked={useLetterhead}
                                    onCheckedChange={setUseLetterhead}
                                    size="sm"
                                />
                            </div>

                            <div className="h-8 w-px bg-slate-200 mx-2" />

                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full p-2 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto bg-slate-100/50 relative flex justify-center p-8 no-scrollbar">
                        {loading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                                <LoadingSpinner size="lg" className="mb-4 text-primary-600" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Generating Preview...</p>
                            </div>
                        ) : (
                            <div
                                className="transition-transform duration-200 ease-out origin-top shadow-2xl shadow-slate-300/50"
                                style={{ transform: `scale(${zoom})` }}
                            >
                                <PagedRichTextEditor
                                    value={html}
                                    onChange={() => { }} // Read only
                                    readOnly={true}
                                    showLetterhead={useLetterhead}
                                    pageOneBg={pageOneBg ?? undefined}
                                    continuationBg={continuationBg ?? undefined}

                                    // Dynamic Margins
                                    marginTop={companyData?.pdfMarginTop ?? 180}
                                    marginBottom={companyData?.pdfMarginBottom ?? 80}
                                    marginLeft={companyData?.pdfMarginLeft ?? 40}
                                    marginRight={companyData?.pdfMarginRight ?? 40}

                                    className="min-h-[297mm] pointer-events-none select-text"
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center z-50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Ready to Publish
                        </div>
                        <div className="flex gap-4">
                            <button onClick={onClose} className="btn-secondary text-xs uppercase tracking-wide">
                                Discard
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={publishing || loading}
                                className="btn-primary flex items-center gap-2 px-6 shadow-xl shadow-primary-900/20"
                            >
                                {publishing ? <LoadingSpinner size="sm" className="text-white" /> : <CheckCircle size={16} />}
                                {publishing ? 'Publishing...' : 'Publish Document'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
