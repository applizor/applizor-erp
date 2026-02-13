import { useEffect, useState } from 'react';
import { X, Briefcase, Building, DollarSign, Calendar, FileText } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';

interface Template {
    id: string;
    name: string;
}

interface GenerateOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateId: string;
    candidateName: string;
    jobTitle?: string;
    onSuccess: () => void;
}

export default function GenerateOfferModal({ isOpen, onClose, candidateId, candidateName, jobTitle, onSuccess }: GenerateOfferModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [formData, setFormData] = useState({
        position: jobTitle || '',
        department: '',
        salary: '',
        startDate: '',
        templateId: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/document-templates/type/Offer Letter');
            setTemplates(res.data);
            if (res.data.length > 0) {
                setFormData(prev => ({ ...prev, templateId: res.data[0].id }));
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        }
    };

    const handleDownload = async () => {
        try {
            const res = await api.get(`/recruitment/candidates/${candidateId}/offer/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Offer_${candidateName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Download failed', err);
            toast.error('Manifest retrieval failed');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            // 1. Create Offer
            await api.post('/recruitment/offers', {
                candidateId,
                ...formData
            });

            toast.success('Offer Generated Successfully');

            // 2. Trigger Authenticated Download
            await handleDownload();

            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to generate offer');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-900/40 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-emerald-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-emerald-50/50 px-5 py-4 border-b border-emerald-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-black text-emerald-900 uppercase tracking-tight">Generate Offer</h3>
                        <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mt-0.5">
                            Candidate: <span className="text-emerald-700">{candidateName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-emerald-100 rounded-md transition-colors text-emerald-400 hover:text-emerald-600">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Briefcase size={10} /> Position Title
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                            value={formData.position}
                            onChange={e => setFormData({ ...formData, position: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <FileText size={10} /> Document Template
                        </label>
                        <select
                            required
                            className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                            value={formData.templateId}
                            onChange={e => setFormData({ ...formData, templateId: e.target.value })}
                        >
                            <option value="" disabled>Select Template</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Building size={10} /> Department
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Engineering, Sales"
                            className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <DollarSign size={10} /> Annual CTC
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.salary}
                                onChange={e => setFormData({ ...formData, salary: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Calendar size={10} /> Joining Date
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Generating...' : 'Create & Download'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
