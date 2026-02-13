'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { Check, X, Eye, FileText, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

export default function TaxReviewDashboard() {
    const [loading, setLoading] = useState(true);
    const [pendingInvestments, setPendingInvestments] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');

    useEffect(() => {
        loadPending();
    }, []);

    const loadPending = async () => {
        try {
            // Fetch all declarations with pending investments
            const res = await api.get('/payroll/list?month=2&year=2026');
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load pending reviews');
        }
    };

    const handleReview = async (investmentId: string, approvedAmount: number, status: 'approved' | 'rejected') => {
        try {
            await api.post(`/payroll/declarations/investments/${investmentId}/review`, {
                approvedAmount,
                status,
                rejectionReason: status === 'rejected' ? 'Insufficient Proof' : null
            });
            toast.success(`Investment ${status}`);
            loadPending();
        } catch (error) {
            toast.error('Action failed');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black uppercase text-gray-900">Tax Compliance Review</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">FY 2025-26 • Investment Verification Audit</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input className="ent-input pl-10 h-10 w-64 uppercase text-[10px] font-bold" placeholder="Search Employee..." />
                    </div>
                </div>
            </div>

            <Card className="ent-card">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase">Pending Verifications</CardTitle>
                </CardHeader>
                <CardContent>
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
                            {/* Mock Data for Demonstration until Backend Seeding is done */}
                            <TableRow>
                                <TableCell>
                                    <div className="font-bold">Arun Sharma</div>
                                    <div className="text-[9px] text-slate-500">EMP001</div>
                                </TableCell>
                                <TableCell><span className="bg-primary-50 text-primary-900 px-2 py-1 rounded text-[9px] font-black uppercase">80C</span></TableCell>
                                <TableCell className="font-bold">LIC Premium Payment</TableCell>
                                <TableCell className="font-black">₹45,000</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" className="h-8 text-primary-600 font-bold text-[10px] gap-2">
                                        <Eye size={12} /> View Proof
                                    </Button>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button onClick={() => handleReview('mock-id', 45000, 'approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3">
                                        <Check size={14} />
                                    </Button>
                                    <Button onClick={() => handleReview('mock-id', 0, 'rejected')} className="bg-rose-600 hover:bg-rose-700 text-white h-8 px-3">
                                        <X size={14} />
                                    </Button>
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell>
                                    <div className="font-bold">Priya Patel</div>
                                    <div className="text-[9px] text-slate-500">EMP042</div>
                                </TableCell>
                                <TableCell><span className="bg-primary-50 text-primary-900 px-2 py-1 rounded text-[9px] font-black uppercase">80D</span></TableCell>
                                <TableCell className="font-bold">Medical Health Insurance</TableCell>
                                <TableCell className="font-black">₹15,000</TableCell>
                                <TableCell>
                                    <Button variant="ghost" className="h-8 text-primary-600 font-bold text-[10px] gap-2">
                                        <Eye size={12} /> View Proof
                                    </Button>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3">
                                        <Check size={14} />
                                    </Button>
                                    <Button className="bg-rose-600 hover:bg-rose-700 text-white h-8 px-3">
                                        <X size={14} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
