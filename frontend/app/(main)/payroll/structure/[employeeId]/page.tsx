'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { payrollApi, SalaryComponent, EmployeeSalaryStructure } from '@/lib/api/payroll';
import { employeesApi } from '@/lib/api/hrms';

import Link from 'next/link';

export default function SalaryStructurePage({ params }: { params: { employeeId: string } }) {
    const toast = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [employee, setEmployee] = useState<any>(null);
    const [components, setComponents] = useState<SalaryComponent[]>([]);

    // Form State
    const [ctc, setCtc] = useState<number>(0);
    const [breakdown, setBreakdown] = useState<Record<string, number>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [emp, comps, struct] = await Promise.all([
                employeesApi.getById(params.employeeId),
                payrollApi.getComponents(),
                payrollApi.getStructure(params.employeeId).catch(() => null)
            ]);

            setEmployee(emp);
            setComponents(comps);

            if (struct) {
                setCtc(Number(struct.ctc));
                const mapping: any = {};
                struct.components.forEach((c: any) => mapping[c.componentId] = Number(c.monthlyAmount));
                setBreakdown(mapping);
            } else {
                // Initialize defaults if allowed? 
                // For now, empty or 0
            }
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoCalculate = () => {
        if (!ctc) return;
        const monthlyCtc = ctc / 12;

        // Standard Indian Structure Rules (Demo)
        // Basic: 50% of CTC
        // HRA: 50% of Basic
        // Special: Balance

        const basic = monthlyCtc * 0.5;
        const hra = basic * 0.5;

        // Find component IDs
        const basicComp = components.find(c => c.name.toLowerCase().includes('basic'));
        const hraComp = components.find(c => c.name.toLowerCase().includes('hra'));
        const specialComp = components.find(c => c.name.toLowerCase().includes('special') || c.name.toLowerCase().includes('allowance'));

        const newBreakdown: any = { ...breakdown };

        let allocated = 0;

        if (basicComp) {
            newBreakdown[basicComp.id] = basic;
            allocated += basic;
        }
        if (hraComp) {
            newBreakdown[hraComp.id] = hra;
            allocated += hra;
        }

        // Deductions (PF) - usually 12% of Basic
        const pfComp = components.find(c => c.type === 'deduction' && c.name.toLowerCase().includes('pf'));
        if (pfComp && basicComp) {
            const pf = basic * 0.12;
            newBreakdown[pfComp.id] = pf;
            // PF is usually deducted from Gross, not part of CTC allocation if CTC = Cost to Company?
            // If CTC includes Employer PF, logic differs. 
            // Simplified: CTC = Gross Salary. Deductions are subtracted from Gross.
        }

        if (specialComp) {
            const balance = monthlyCtc - allocated;
            newBreakdown[specialComp.id] = balance > 0 ? balance : 0;
        }

        setBreakdown(newBreakdown);
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Calculate Net Salary (Total Earnings - Total Deductions)
            let gross = 0;
            let deductions = 0;

            const componentList = Object.entries(breakdown).map(([compId, amount]) => {
                const comp = components.find(c => c.id === compId);
                if (comp) {
                    if (comp.type === 'earning') gross += amount;
                    if (comp.type === 'deduction') deductions += amount;
                }
                return { componentId: compId, amount };
            });

            await payrollApi.saveStructure(params.employeeId, {
                ctc,
                netSalary: gross - deductions,
                components: componentList
            });

            toast.success('Salary Structure Saved!');
            router.push('/hrms/employees');
        } catch (error) {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link href="/hrms/employees" className="text-gray-500 hover:text-gray-700">← Back</Link>
                    <h1 className="text-2xl font-bold mt-2">Salary Structure: {employee?.firstName} {employee?.lastName}</h1>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700">Annual CTC (Cost to Company)</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                                type="number"
                                value={ctc}
                                onChange={(e) => setCtc(Number(e.target.value))}
                                className="focus:ring-primary-500 focus:border-primary-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300 p-2 border"
                            />
                            <button
                                onClick={handleAutoCalculate}
                                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                            >
                                Auto-Split
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-medium text-green-700 mb-4">Earnings</h3>
                            <div className="space-y-4">
                                {components.filter(c => c.type === 'earning').map(comp => (
                                    <div key={comp.id}>
                                        <label className="block text-sm font-medium text-gray-700">{comp.name}</label>
                                        <input
                                            type="number"
                                            value={breakdown[comp.id] || 0}
                                            onChange={(e) => setBreakdown({ ...breakdown, [comp.id]: Number(e.target.value) })}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-red-700 mb-4">Deductions</h3>
                            <div className="space-y-4">
                                {components.filter(c => c.type === 'deduction').map(comp => (
                                    <div key={comp.id}>
                                        <label className="block text-sm font-medium text-gray-700">{comp.name}</label>
                                        <input
                                            type="number"
                                            value={breakdown[comp.id] || 0}
                                            onChange={(e) => setBreakdown({ ...breakdown, [comp.id]: Number(e.target.value) })}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t pt-6 flex justify-between items-center bg-gray-50 p-4 rounded-md">
                        <div>
                            <p className="text-sm text-gray-500">Gross Monthly: <span className="font-bold text-gray-900">
                                {Object.entries(breakdown).reduce((sum, [id, val]) => {
                                    const c = components.find(x => x.id === id);
                                    return c?.type === 'earning' ? sum + val : sum;
                                }, 0).toFixed(2)}
                            </span></p>
                            <p className="text-sm text-gray-500">Net Monthly: <span className="font-bold text-green-600 text-lg">
                                {Object.entries(breakdown).reduce((sum, [id, val]) => {
                                    const c = components.find(x => x.id === id);
                                    return c?.type === 'earning' ? sum + val : sum - val;
                                }, 0).toFixed(2)}
                            </span></p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Structure'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
