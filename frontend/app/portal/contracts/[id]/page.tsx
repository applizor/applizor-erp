'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FileSignature, Download, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';

export default function ContractDetailPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const signaturePadRef = useRef<any>(null);

    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signerName, setSignerName] = useState('');

    const fetchContract = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/portal/contracts/${params.id}`);
            setContract(res.data);

            // Log view
            api.post(`/portal/contracts/${params.id}/view`).catch(err => console.error('Failed to log view', err));

            // Pre-fill signer name from user data
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                setSignerName(user.name || '');
            }
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to load contract');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContract();
    }, [params.id]);

    const handleDownloadPdf = async () => {
        try {
            const response = await api.get(`/portal/contracts/${params.id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Contract-${contract.title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Contract PDF downloaded');
        } catch (error) {
            console.error('PDF download failed', error);
            toast.error('Failed to download PDF');
        }
    };

    const handleSignContract = async () => {
        if (!signerName.trim()) {
            toast.error('Please enter your full name');
            return;
        }

        if (signaturePadRef.current?.isEmpty()) {
            toast.error('Please provide your signature');
            return;
        }

        setSigning(true);
        try {
            const signatureDataUrl = signaturePadRef.current.toDataURL();

            await api.post(`/portal/contracts/${params.id}/sign`, {
                signature: signatureDataUrl,
                name: signerName,
                useLetterhead: true
            });

            toast.success('Contract signed successfully!');
            setShowSignatureModal(false);
            fetchContract(); // Refresh to show signed status
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to sign contract');
        } finally {
            setSigning(false);
        }
    };

    const clearSignature = () => {
        signaturePadRef.current?.clear();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="text-center py-16">
                <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 font-medium">Contract not found</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title={contract.title}
                subtitle={`Created on ${new Date(contract.createdAt).toLocaleDateString()}`}
                icon={FileSignature}
                actions={
                    <div className="flex gap-2">
                        <Link href="/portal/contracts" className="btn-secondary">
                            <ArrowLeft size={14} className="mr-2" />
                            BACK
                        </Link>
                        <button onClick={handleDownloadPdf} className="btn-secondary">
                            <Download size={14} className="mr-2" />
                            DOWNLOAD PDF
                        </button>
                        {!contract.signedAt && (
                            <button
                                onClick={() => setShowSignatureModal(true)}
                                className="btn-primary"
                            >
                                <FileSignature size={14} className="mr-2" />
                                SIGN CONTRACT
                            </button>
                        )}
                    </div>
                }
            />

            {/* Status Banner */}
            {contract.signedAt ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle size={20} className="text-emerald-600" />
                    <div>
                        <p className="text-sm font-black text-emerald-900">Contract Signed</p>
                        <p className="text-xs text-emerald-700 mt-0.5">
                            Signed on {new Date(contract.signedAt).toLocaleString()} from IP {contract.signerIp}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle size={20} className="text-amber-600" />
                    <div>
                        <p className="text-sm font-black text-amber-900">Signature Required</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            Please review the contract and sign to proceed.
                        </p>
                    </div>
                </div>
            )}

            {/* Contract Content */}
            <div className="ent-card">
                <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: contract.content }}
                />
            </div>

            {/* Signature Modal */}
            {showSignatureModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-slate-50">
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">
                                Sign Contract
                            </h3>
                            <p className="text-[10px] text-slate-500 font-bold mt-1">
                                PROVIDE YOUR DIGITAL SIGNATURE
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="ent-label">Full Name</label>
                                <input
                                    type="text"
                                    value={signerName}
                                    onChange={(e) => setSignerName(e.target.value)}
                                    className="ent-input w-full"
                                    placeholder="Enter your full legal name"
                                />
                            </div>

                            <div>
                                <label className="ent-label">Signature</label>
                                <div className="border-2 border-slate-200 rounded-lg bg-white">
                                    <SignatureCanvas
                                        ref={signaturePadRef}
                                        canvasProps={{
                                            className: 'w-full h-48 cursor-crosshair',
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={clearSignature}
                                    className="text-xs text-slate-500 hover:text-slate-700 mt-2 font-bold"
                                >
                                    Clear Signature
                                </button>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                <p className="text-[10px] text-slate-600 font-bold">
                                    By signing this contract, you agree to the terms and conditions outlined above.
                                    Your signature will be legally binding.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSignatureModal(false)}
                                className="ent-button-secondary"
                                disabled={signing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSignContract}
                                className="btn-primary"
                                disabled={signing}
                            >
                                {signing ? (
                                    <>
                                        <LoadingSpinner />
                                        Signing...
                                    </>
                                ) : (
                                    <>
                                        <FileSignature size={14} className="mr-2" />
                                        Sign Contract
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
