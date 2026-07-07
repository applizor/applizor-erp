'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { Check, X, Eye, FileText, Search, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

export default function TaxReviewDashboard() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [declarations, setDeclarations] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadPending();
    }, []);

    const loadPending = async () => {
        try {
            setLoading(true);
            const res = await api.get('/payroll/declarations/pending');
            setDeclarations(res.data);
        } catch (error) {
            toast.error('Failed to load pending reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (investmentId: string, approvedAmount: number, status: 'approved' | 'rejected') => {
        try {
            setActionLoading(investmentId);
            await api.post(`/payroll/declarations/investments/${investmentId}/review`, {
                approvedAmount,
                status,
                rejectionReason: status === 'rejected' ? 'Insufficient Proof' : null
            });
            toast.success(`Investment ${status}`);
            loadPending();
        } catch (error) {
            toast.error('Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const allInvestments = declarations.flatMap((d: any) =>
        (d.investments || [])
            .filter((inv: any) => inv.status === 'pending')
            .map((inv: any) => ({
                ...inv,
                employeeName: d.employeeName || 'Unknown',
                employeeId: d.employeeId || 'N/A'
            }))
    );

    const filtered = allInvestments.filter((inv: any) =>
        !search ||
        `${inv.employeeName} ${inv.employeeId} ${inv.section} ${inv.componentName}`
            .toUpperCase().includes(search.toUpperCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black uppercase text-gray-900">Tax Compliance Review</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">FY 2025-26 &bull; Investment Verification Audit</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            className="ent-input pl-10 h-10 w-64 uppercase text-[10px] font-bold"
                            placeholder="Search Employee..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card className="ent-card">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase">Pending Verifications</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 size={32} className="animate-spin text-primary-600 mb-4" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading pending reviews...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 opacity-40">
                            <FileText size={40} className="text-gray-300 mb-4" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {declarations.length === 0 ? 'No pending declarations found' : 'No matching records'}
                            </p>
                        </div>
                    ) : (
                        <Table className="ent-table">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Section</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Declared</TableHead>
                                    <TableHead>Proof</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((inv: any) => (
                                    <TableRow key={inv.id}>
                                        <TableCell>
                                            <div className="font-bold">{inv.employeeName}</div>
                                            <div className="text-[9px] text-slate-500">{inv.employeeId}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="bg-primary-50 text-primary-900 px-2 py-1 rounded text-[9px] font-black uppercase">{inv.section}</span>
                                        </TableCell>
                                        <TableCell className="font-bold">{inv.componentName}</TableCell>
                                        <TableCell className="font-black">₹{Number(inv.declaredAmount).toLocaleString('en-IN')}</TableCell>
                                        <TableCell>
                                            {inv.proofUrl ? (
                                                <a href={inv.proofUrl} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="ghost" size="sm" className="h-8 text-primary-600 font-bold text-[10px] gap-2">
                                                        <Eye size={12} /> View Proof
                                                    </Button>
                                                </a>
                                            ) : (
                                                <span className="text-[9px] text-gray-400 font-bold uppercase">Not uploaded</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                onClick={() => handleReview(inv.id, inv.declaredAmount, 'approved')}
                                                disabled={actionLoading === inv.id}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3"
                                            >
                                                {actionLoading === inv.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                            </Button>
                                            <Button
                                                onClick={() => handleReview(inv.id, 0, 'rejected')}
                                                disabled={actionLoading === inv.id}
                                                className="bg-rose-600 hover:bg-rose-700 text-white h-8 px-3"
                                            >
                                                {actionLoading === inv.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
