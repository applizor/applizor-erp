'use client';

import { useState, useEffect } from 'react';
import { LogOut, FileText, Package, CheckCircle2, AlertCircle, Calendar, Download, DollarSign, ArrowRight, Search, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { performanceApi } from '@/lib/api/performance';

export default function ExitManagementPage() {
    const toast = useToast();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [fnfData, setFnfData] = useState<any>(null);
    const [fnfLoading, setFnfLoading] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [exitForm, setExitForm] = useState({ resignationDate: '', lastWorkingDay: '', reason: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/employees');
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : data?.data || []);
        } catch (err) {
            console.error('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedEmployee) {
            loadFnF(selectedEmployee.id);
        } else {
            setFnfData(null);
        }
    }, [selectedEmployee]);

    const loadFnF = async (employeeId: string) => {
        try {
            setFnfLoading(true);
            const data = await performanceApi.getFnF(employeeId);
            setFnfData(data);
        } catch (err) {
            console.error('Failed to load FnF data');
            setFnfData(null);
        } finally {
            setFnfLoading(false);
        }
    };

    const handleInitiateExit = async () => {
        if (!selectedEmployee || !exitForm.resignationDate || !exitForm.lastWorkingDay) {
            toast.error('Please fill all required fields');
            return;
        }
        try {
            setSubmitting(true);
            await performanceApi.initiateExit({
                employeeId: selectedEmployee.id,
                resignationDate: exitForm.resignationDate,
                lastWorkingDay: exitForm.lastWorkingDay,
                reason: exitForm.reason
            });
            toast.success('Exit initiated successfully');
            setShowExitModal(false);
            setExitForm({ resignationDate: '', lastWorkingDay: '', reason: '' });
            loadEmployees();
        } catch (err) {
            toast.error('Failed to initiate exit');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredEmployees = employees.filter((e: any) =>
        `${e.firstName} ${e.lastName} ${e.employeeId}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalEarnings = fnfData ? (fnfData.gratuity + fnfData.leaveEncashment) : 0;
    const totalDeductions = fnfData?.noticeRecovery || 0;
    const netPayable = totalEarnings - totalDeductions;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-rose-900 rounded-md shadow-lg shadow-rose-900/10">
                        <LogOut size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase leading-none">Exit Hub (Offboarding)</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">End-of-Cycle Protocol & FnF Settlement</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowExitModal(true)}
                        disabled={!selectedEmployee}
                        className="ent-button-secondary py-2 px-4 text-[10px] font-black uppercase tracking-widest border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Initiate Resignation
                    </button>
                    <button className="btn-primary py-2 px-4 text-[10px] font-black uppercase tracking-widest bg-rose-900 hover:bg-rose-950 shadow-rose-900/10">
                        Terminate Session
                    </button>
                </div>
            </div>

            {/* Employee Search */}
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search employees by name or ID..."
                        className="ent-input w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {searchTerm && (
                    <div className="mt-3 max-h-48 overflow-y-auto border border-gray-100 rounded-md divide-y divide-gray-50">
                        {loading ? (
                            <p className="p-3 text-xs text-gray-400 text-center">Loading...</p>
                        ) : filteredEmployees.length === 0 ? (
                            <p className="p-3 text-xs text-gray-400 text-center">No employees found</p>
                        ) : (
                            filteredEmployees.map((emp: any) => (
                                <button
                                    key={emp.id}
                                    onClick={() => { setSelectedEmployee(emp); setSearchTerm(''); }}
                                    className={`w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${selectedEmployee?.id === emp.id ? 'bg-primary-50' : ''}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{emp.firstName} {emp.lastName}</p>
                                        <p className="text-[9px] text-gray-400 font-mono">{emp.employeeId}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Protocol Progress */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Offboarding Lifecycle</h3>

                        <div className="space-y-8 relative">
                            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 -z-0" />

                            {[
                                { title: "Resignation Registered", status: selectedEmployee ? "completed" : "pending", date: "TBD", icon: CheckCircle2 },
                                { title: "Notice Period Protocol", status: "pending", date: "Awaiting", icon: Calendar },
                                { title: "Asset Recovery & Clearance", status: "pending", date: "Pending", icon: Package },
                                { title: "Final Settlement (FnF)", status: fnfData ? "active" : "pending", date: fnfData ? "Ready" : "Awaiting", icon: DollarSign },
                            ].map((s, i) => (
                                <div key={i} className="flex gap-4 relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-colors i ${s.status === 'completed' ? 'border-emerald-500 text-emerald-500' :
                                        s.status === 'active' ? 'border-primary-600 text-primary-600 animate-pulse' :
                                            'border-slate-200 text-slate-300'
                                        }`}>
                                        <s.icon size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{s.title}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-50 p-5 rounded-md border border-amber-100 border-l-4 border-l-amber-500">
                        <div className="flex gap-3">
                            <AlertCircle size={18} className="text-amber-600 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black text-amber-900 uppercase tracking-tight leading-tight">Important</p>
                                <p className="text-[9px] font-bold text-amber-700/70 uppercase tracking-widest mt-1">
                                    Select an employee to view their Full & Final Settlement calculation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FnF Visualization */}
                <div className="lg:col-span-8 space-y-6">
                    {!selectedEmployee ? (
                        <div className="bg-white rounded-md border border-gray-200 shadow-xl overflow-hidden p-12 text-center">
                            <DollarSign size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select an employee to view settlement</p>
                        </div>
                    ) : fnfLoading ? (
                        <div className="bg-white rounded-md border border-gray-200 shadow-xl overflow-hidden p-12 text-center">
                            <Loader2 size={32} className="mx-auto text-gray-300 mb-4 animate-spin" />
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Calculating FnF...</p>
                        </div>
                    ) : (
                    <div className="bg-white rounded-md border border-gray-200 shadow-xl overflow-hidden">
                        <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Full & Final Settlement</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{selectedEmployee.firstName} {selectedEmployee.lastName} ({selectedEmployee.employeeId})</p>
                            </div>
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-all text-[9px] font-black uppercase tracking-widest">
                                <Download size={12} /> Get Digitally Signed PDF
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Summary Metadata */}
                            <div className="grid grid-cols-3 gap-6 py-4 border-b border-slate-100">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Associate Identity</p>
                                    <p className="text-xs font-black text-gray-900 uppercase">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tenure</p>
                                    <p className="text-xs font-black text-gray-900 uppercase">{fnfData?.tenureYears || 0} Years</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Earned Leave Balance</p>
                                    <p className="text-xs font-black text-gray-900 uppercase">{fnfData?.earnedLeaveBalance || 0} Days</p>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Earnings Column */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b-2 border-slate-100">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gross Credits</h4>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">(+) ADDITIONS</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between group">
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight group-hover:text-slate-900 transition-colors">Gratuity</span>
                                            <span className="text-[10px] font-black text-gray-900">₹{(fnfData?.gratuity || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between group">
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight group-hover:text-slate-900 transition-colors">Leave Encashment</span>
                                            <span className="text-[10px] font-black text-gray-900">₹{(fnfData?.leaveEncashment || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-xs font-black text-gray-900 uppercase">Total Credits</span>
                                        <span className="text-xs font-black text-emerald-600">₹{(fnfData?.gratuity + fnfData?.leaveEncashment || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Deductions Column */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b-2 border-slate-100">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Debits</h4>
                                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">(-) RECOVERIES</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between group">
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight group-hover:text-slate-900 transition-colors">Notice Pay Recovery</span>
                                            <span className="text-[10px] font-black text-gray-900">₹{(fnfData?.noticeRecovery || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-xs font-black text-gray-900 uppercase">Total Debits</span>
                                        <span className="text-xs font-black text-rose-600">₹{(fnfData?.noticeRecovery || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Net Settlement Banner */}
                            <div className="mt-8 p-6 bg-primary-900 rounded-md shadow-2xl shadow-primary-900/40 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                                        <DollarSign size={24} className="text-primary-100" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-primary-200 font-bold uppercase tracking-widest mb-1">Terminal Disbursement Amount</p>
                                        <p className="text-4xl font-black text-white leading-none tracking-tighter">₹{((fnfData?.gratuity || 0) + (fnfData?.leaveEncashment || 0) - (fnfData?.noticeRecovery || 0)).toLocaleString()}</p>
                                    </div>
                                </div>
                                <button className="w-full md:w-auto px-8 py-3 bg-white text-primary-900 text-xs font-black uppercase tracking-widest rounded shadow-xl hover:bg-primary-50 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    Approve Settlement <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                            <FileText size={14} className="text-slate-400" />
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                                This statement is a computational preview and remains subject to final audit clearance and asset recovery verification.
                            </p>
                        </div>
                    </div>
                    )}
                </div>
            </div>

            {/* Initiate Exit Modal */}
            {showExitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-md shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Initiate Resignation</h3>
                            <button onClick={() => setShowExitModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X size={16} />
                            </button>
                        </div>

                        {selectedEmployee && (
                            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Employee</p>
                                <p className="text-sm font-black text-gray-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Resignation Date</label>
                                <input
                                    type="date"
                                    value={exitForm.resignationDate}
                                    onChange={(e) => setExitForm({ ...exitForm, resignationDate: e.target.value })}
                                    className="ent-input w-full"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Last Working Day</label>
                                <input
                                    type="date"
                                    value={exitForm.lastWorkingDay}
                                    onChange={(e) => setExitForm({ ...exitForm, lastWorkingDay: e.target.value })}
                                    className="ent-input w-full"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Reason</label>
                                <textarea
                                    value={exitForm.reason}
                                    onChange={(e) => setExitForm({ ...exitForm, reason: e.target.value })}
                                    className="ent-input w-full"
                                    rows={3}
                                    placeholder="Reason for resignation..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="ent-button-secondary py-2 px-4 text-[10px] font-black uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInitiateExit}
                                disabled={submitting}
                                className="btn-primary py-2 px-4 text-[10px] font-black uppercase tracking-widest bg-rose-900 hover:bg-rose-950 disabled:opacity-50"
                            >
                                {submitting ? 'Processing...' : 'Confirm Exit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}