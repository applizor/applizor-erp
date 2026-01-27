'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Calculator, Info, Calendar, DollarSign, User, ShieldCheck, FileType } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CurrencySelect } from '@/components/ui/CurrencySelect';

const itemSchema = z.object({
    description: z.string().min(1, 'Description required'),
    quantity: z.number().min(0.01, 'Min 0.01'),
    rate: z.number().min(0, 'Min 0'),
    taxRate: z.number().min(0).default(0),
    hsnCode: z.string().optional(),
});

const invoiceSchema = z.object({
    type: z.enum(['invoice', 'quotation', 'proforma']),
    clientId: z.string().min(1, 'Client selection required'),
    invoiceDate: z.string(),
    dueDate: z.string(),
    currency: z.string(),
    notes: z.string().optional(),
    terms: z.string().optional(),
    items: z.array(itemSchema).min(1, 'At least one line item required'),
    discount: z.number().min(0).default(0),
    isRecurring: z.boolean().default(false),
    recurringInterval: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
    initialData?: any;
    clients: any[];
    onSubmit: (data: InvoiceFormValues) => void;
    loading?: boolean;
}

export function InvoiceForm({ initialData, clients, onSubmit, loading }: InvoiceFormProps) {
    const { currency: globalCurrency, formatCurrency } = useCurrency();

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: initialData || {
            type: 'invoice',
            clientId: '',
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            currency: globalCurrency || 'USD',
            items: [{ description: '', quantity: 1, rate: 0, taxRate: 0 }],
            discount: 0,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    const watchItems = watch('items');
    const watchDiscount = watch('discount');
    const watchType = watch('type');

    const calculateTotals = () => {
        let subtotal = 0;
        let totalTax = 0;

        watchItems.forEach((item) => {
            const amount = (item.quantity || 0) * (item.rate || 0);
            const tax = amount * ((item.taxRate || 0) / 100);
            subtotal += amount;
            totalTax += tax;
        });

        const total = subtotal + totalTax - (watchDiscount || 0);
        return { subtotal, totalTax, total };
    };

    const totals = calculateTotals();

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Primary Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Meta Configuration */}
                <div className="space-y-4">
                    <div className="ent-form-group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <FileType className="w-3 h-3" />
                            Protocol Type
                        </label>
                        <select
                            {...register('type')}
                            className="ent-input w-full font-bold text-xs"
                        >
                            <option value="invoice">Standard Tax Invoice</option>
                            <option value="quotation">Commercial Quotation</option>
                            <option value="proforma">Proforma Memorandum</option>
                        </select>
                    </div>

                    <div className="ent-form-group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <User className="w-3 h-3" />
                            Consignee Entity
                        </label>
                        <select
                            {...register('clientId')}
                            className={`ent-input w-full font-bold text-xs ${errors.clientId ? 'border-rose-500 ring-rose-500/10' : ''}`}
                        >
                            <option value="">Select Target Entity...</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name} {client.email ? `(${client.email})` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.clientId && <p className="mt-1 text-[9px] font-black text-rose-500 uppercase tracking-tight">{errors.clientId.message}</p>}
                    </div>
                </div>

                {/* Temporal Parameters */}
                <div className="space-y-4">
                    <div className="ent-form-group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Calendar className="w-3 h-3" />
                            Origination Date
                        </label>
                        <input
                            type="date"
                            {...register('invoiceDate')}
                            className="ent-input w-full font-bold text-xs"
                        />
                    </div>

                    <div className="ent-form-group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Calendar className="w-3 h-3" />
                            Maturity Deadline
                        </label>
                        <input
                            type="date"
                            {...register('dueDate')}
                            className="ent-input w-full font-bold text-xs"
                        />
                    </div>
                </div>

                {/* Financial Context */}
                <div className="space-y-4">
                    <div className="ent-form-group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <DollarSign className="w-3 h-3" />
                            Currency Base
                        </label>
                        <CurrencySelect
                            value={watch('currency')}
                            onChange={(val) => setValue('currency', val)}
                            className="w-full"
                        />
                    </div>

                    {/* Automation Logic */}
                    {watchType === 'invoice' && (
                        <div className="p-3 bg-primary-50/50 rounded-lg border border-primary-100/50 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isRecurring"
                                    {...register('isRecurring')}
                                    className="w-4 h-4 rounded border-primary-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                />
                                <label htmlFor="isRecurring" className="text-[10px] font-black text-primary-900 uppercase tracking-widest cursor-pointer">
                                    Enable Automated Cycle
                                </label>
                            </div>

                            {watch('isRecurring') && (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                    <select
                                        {...register('recurringInterval')}
                                        className="w-full bg-white border-primary-200 rounded py-1 px-2 text-[10px] font-black uppercase tracking-widest text-primary-700 outline-none focus:ring-0 shadow-sm"
                                    >
                                        <option value="monthly">Monthly Cycle</option>
                                        <option value="weekly">Weekly Cycle</option>
                                        <option value="quarterly">Quarterly Cycle</option>
                                        <option value="yearly">Yearly Cycle</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Line Item Architecture */}
            <div className="border border-gray-100 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Calculator className="w-3.5 h-3.5 text-primary-600" />
                        Line Item Breakdown
                    </h3>
                    <button
                        type="button"
                        onClick={() => append({ description: '', quantity: 1, rate: 0, taxRate: 0 })}
                        className="text-[10px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest flex items-center gap-1 transition-all"
                    >
                        <Plus size={14} /> Append Component
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/30 text-left border-b border-gray-50">
                                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.1em]">Resource Description</th>
                                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] w-24">Units</th>
                                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] w-32">Unit Rate</th>
                                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] w-24">Tax Factor %</th>
                                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] w-40 text-right">Net Value</th>
                                <th className="px-4 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {fields.map((field, index) => (
                                <tr key={field.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-2">
                                        <input
                                            {...register(`items.${index}.description`)}
                                            placeholder="Component or service identifier..."
                                            className="w-full border-none bg-transparent focus:ring-0 text-[11px] font-bold placeholder:text-gray-300 placeholder:italic p-0"
                                        />
                                        {errors.items?.[index]?.description && (
                                            <span className="text-[8px] font-black text-rose-500 uppercase block leading-none mt-1">{errors.items[index]?.description?.message}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            step="any"
                                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                            className="w-full bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white rounded px-1.5 py-1 text-[11px] font-black text-gray-900 transition-all text-center"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            step="any"
                                            {...register(`items.${index}.rate`, { valueAsNumber: true })}
                                            className="w-full bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white rounded px-1.5 py-1 text-[11px] font-black text-gray-900 transition-all text-right"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            step="any"
                                            {...register(`items.${index}.taxRate`, { valueAsNumber: true })}
                                            className="w-full bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white rounded px-1.5 py-1 text-[11px] font-black text-gray-900 transition-all text-center"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-right text-[11px] font-black text-gray-900">
                                        {formatCurrency((watchItems[index]?.quantity || 0) * (watchItems[index]?.rate || 0))}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        {fields.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="text-gray-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Supplemental Intelligence */}
                <div className="space-y-4">
                    <div className="ent-form-group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            Communication Notes
                        </label>
                        <textarea
                            {...register('notes')}
                            rows={3}
                            className="ent-input w-full text-xs font-medium min-h-[100px]"
                            placeholder="Directives or clarifications for the consignee entity..."
                        />
                    </div>
                    <div className="ent-form-group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            Contractual Terms
                        </label>
                        <textarea
                            {...register('terms')}
                            rows={3}
                            className="ent-input w-full text-xs font-medium min-h-[100px]"
                            placeholder="Regulatory or commercial terms governing this transaction..."
                        />
                    </div>
                </div>

                {/* Final Calculation Matrix */}
                <div className="bg-gray-900 text-white p-6 rounded-lg shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-primary-600/20 transition-all duration-700" />

                    <div className="space-y-3 relative z-10 border-b border-white/5 pb-6">
                        <div className="flex justify-between items-center text-gray-400">
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Gross Subtotal</span>
                            <span className="text-xs font-black text-white">{formatCurrency(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400">
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Aggregated Tax Factor</span>
                            <span className="text-xs font-black text-emerald-400">+{formatCurrency(totals.totalTax)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none">Correction / Discount</span>
                            <div className="w-24 flex items-center bg-white/5 rounded px-2 border border-white/10 hover:border-white/20 transition-all">
                                <span className="text-[10px] text-gray-500 mr-1">-</span>
                                <input
                                    type="number"
                                    {...register('discount', { valueAsNumber: true })}
                                    className="bg-transparent border-none focus:ring-0 text-[11px] font-black text-rose-400 text-right w-full p-1"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 relative z-10">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] mb-2 leading-none">Consolidated Valuation</p>
                                <h2 className="text-3xl font-black tracking-tighter text-white">{formatCurrency(totals.total)}</h2>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase bg-white/5 px-2 py-1 rounded-full border border-white/10">
                                    <ShieldCheck size={10} className="text-primary-500" />
                                    Secure Computation
                                </span>
                                <span className="text-[9px] font-bold text-gray-500">Billed in {watch('currency')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Execution Controls */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-6 py-2 rounded text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 hover:text-gray-900 transition-all"
                >
                    Discard Draft
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-2 rounded bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.15em] hover:bg-primary-700 shadow-lg shadow-primary-500/20 disabled:opacity-50 transition-all flex items-center gap-2 group"
                >
                    {loading ? <LoadingSpinner size="sm" /> : (
                        <>
                            Commit {watchType === 'quotation' ? 'Quotation' : 'Invoice'}
                            <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
