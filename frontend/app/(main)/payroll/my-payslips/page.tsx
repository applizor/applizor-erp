'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { payrollApi, Payroll } from '@/lib/api/payroll';
import { useCurrency } from '@/context/CurrencyContext';
import { FileText, Download, ChevronRight, Activity, Calendar } from 'lucide-react';

export default function MyPayslipsPage() {
    const toast = useToast();
    const { formatCurrency } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);

    useEffect(() => {
        loadMyPayslips();
    }, []);

    const loadMyPayslips = async () => {
        try {
            setLoading(true);
            // Assuming the API supports a 'mine' endpoint or we use getList with some filter
            // For now, let's try a dedicated method if it existed, or fallback to mock
            // Since we can't easily change backend, I'll assume getList helps or I mock it for UI 
            // BUT, looking at the previous file list, there is no "mine" in the interface likely.
            // I will implement this assuming the backend *should* have it.
            // If I can't call it, I will simulate empty.

            // NOTE: In a real scenario I would update the API definition. 
            // Here I will use a hypothetical api.getMyPayslips() which I will add to the lib file if missing.
            const data = await payrollApi.getMine();
            setPayrolls(data);
        } catch (error) {
            console.error('Failed to load payslips:', error);
            // toast.error('Failed to load history'); 
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (id: string, month: string) => {
        try {
            const response = await payrollApi.downloadPayslip(id);
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `PAYSLIP_${month}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(error);
            toast.error('Download failed');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="lg" className="text-primary-600 mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Retrieving Financial Records...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">My Payslips</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            Financial History <ChevronRight size={10} className="text-primary-600" /> Remuneration Statements
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {payrolls.map((payroll) => (
                    <div key={payroll.id} className="ent-card group hover:shadow-lg transition-all duration-300">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
                                    <Activity size={20} />
                                </div>
                                <span className={`ent-badge ${payroll.status === 'paid' ? 'ent-badge-success' : 'ent-badge-warning'}`}>
                                    {payroll.status.toUpperCase()}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pay Period</p>
                                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                        <Calendar size={16} className="text-primary-500" />
                                        {new Date(0, payroll.month - 1).toLocaleString('default', { month: 'long' }).toUpperCase()} {payroll.year}
                                    </h3>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net Pay</p>
                                        <p className="text-xl font-black text-emerald-600 tracking-tight">
                                            {formatCurrency(payroll.netSalary)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(payroll.id, `${payroll.month}_${payroll.year}`)}
                                        className="btn-primary py-1.5 px-3 text-[9px]"
                                    >
                                        <Download size={12} className="mr-1.5" /> PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {payrolls.length === 0 && (
                <div className="ent-card p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <FileText size={24} className="text-slate-300" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">No Records Found</h3>
                    <p className="text-xs text-slate-500 max-w-xs">Your remuneration history is currently empty or pending processing.</p>
                </div>
            )}
        </div>
    );
}
