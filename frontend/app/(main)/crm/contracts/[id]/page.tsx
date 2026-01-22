'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Printer, Send, Edit, Download, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';

export default function ContractDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState<any>(null);

    useEffect(() => {
        fetchContract();
    }, []);

    const fetchContract = async () => {
        try {
            const res = await api.get(`/contracts/${params.id}`);
            setContract(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load contract');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        try {
            await api.put(`/contracts/${params.id}`, { status: 'sent', sentAt: new Date() });
            toast.success('Contract marked as Sent');
            fetchContract();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <LoadingSpinner size="lg" />
        </div>
    );

    if (!contract) return <div>Contract not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
            <div className="flex items-center justify-between">
                <Link
                    href="/crm/contracts"
                    className="flex items-center text-slate-500 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Contracts
                </Link>
                <div className="flex items-center gap-3">
                    {contract.status === 'draft' && (
                        <Link
                            href={`/crm/contracts/${params.id}/edit`}
                            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                            <Edit size={16} />
                            Edit
                        </Link>
                    )}
                    {contract.status === 'draft' && (
                        <button
                            onClick={handleSend}
                            className="bg-primary-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary-800 transition-colors flex items-center gap-2 shadow-lg shadow-primary-900/20"
                        >
                            <Send size={16} />
                            Publish to Portal
                        </button>
                    )}
                    {contract.status !== 'draft' && (
                        <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/contracts/${contract.id}/pdf`}
                            target="_blank"
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                            <Download size={16} />
                            Download PDF
                        </a>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 mb-2">{contract.title}</h1>
                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <span>Client: {contract.client.name}</span>
                            <span>•</span>
                            <span>Created: {new Date(contract.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className={`
                                px-2 py-0.5 rounded border
                                ${contract.status === 'signed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}
                            `}>
                                {contract.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-12 min-h-[500px] prose prose-slate max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: contract.content }} />
                </div>

                {contract.status === 'signed' && (
                    <div className="p-8 bg-emerald-50 border-t border-emerald-100 mt-20">
                        <h3 className="text-emerald-800 font-bold uppercase tracking-wider text-xs mb-4">Digitally Signed</h3>
                        <div className="flex items-center gap-6">
                            <div className="bg-white p-4 border border-emerald-200 rounded-lg">
                                <img src={contract.clientSignature} alt="Signature" className="h-16" />
                            </div>
                            <div className="text-xs text-emerald-700">
                                <p><strong>Signed By:</strong> {contract.signerName}</p>
                                <p><strong>Date:</strong> {new Date(contract.signedAt).toLocaleString()}</p>
                                <p><strong>IP Address:</strong> {contract.signerIp}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
