'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Calculator, Info } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const itemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(0.01, 'Min 0.01'),
    rate: z.number().min(0, 'Min 0'),
    taxRate: z.number().min(0).default(0),
    hsnCode: z.string().optional(),
});

const invoiceSchema = z.object({
    type: z.enum(['invoice', 'quotation', 'proforma']),
    clientId: z.string().min(1, 'Client is required'),
    invoiceDate: z.string(),
    dueDate: z.string(),
    currency: z.string(),
    notes: z.string().optional(),
    terms: z.string().optional(),
    items: z.array(itemSchema).min(1, 'At least one item is required'),
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

    // Multi-tax calculation logic
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Document Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Document Type</label>
                        <select
                            {...register('type')}
                            className="w-full rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        >
                            <option value="invoice">Tax Invoice</option>
                            <option value="quotation">Quotation / Estimate</option>
                            <option value="proforma">Proforma Invoice</option>
                        </select>
                    </div>

                    {/* Client Selection */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Select Client</label>
                        <select
                            {...register('clientId')}
                            className={`w-full rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 transition-all ${errors.clientId ? 'border-red-500' : ''
                                }`}
                        >
                            <option value="">Choose a client...</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name} {client.email ? `(${client.email})` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.clientId && <p className="mt-1 text-xs text-red-500">{errors.clientId.message}</p>}
                    </div>

                    {/* Dates */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Issue Date</label>
                        <input
                            type="date"
                            {...register('invoiceDate')}
                            className="w-full rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {watchType === 'quotation' ? 'Expiry Date' : 'Due Date'}
                        </label>
                        <input
                            type="date"
                            {...register('dueDate')}
                            className="w-full rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        />
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Currency</label>
                        <select
                            {...register('currency')}
                            className="w-full rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="INR">INR (₹)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                        </select>
                    </div>

                    {/* Recurring Options */}
                    {watchType === 'invoice' && (
                        <div className="md:col-span-3 bg-primary-50 px-4 py-3 rounded-xl border border-primary-100 flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isRecurring"
                                    {...register('isRecurring')}
                                    className="w-5 h-5 rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div>
                                    <label htmlFor="isRecurring" className="block text-sm font-bold text-primary-900 leading-none">Make this a Recurring Invoice</label>
                                    <p className="text-xs text-primary-600 mt-1">Automatically generate and send this invoice on a schedule.</p>
                                </div>
                            </div>

                            {watch('isRecurring') && (
                                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="text-sm font-medium text-primary-700">Repeat</span>
                                    <select
                                        {...register('recurringInterval')}
                                        className="bg-white border-primary-200 rounded-lg text-sm font-bold text-primary-900 focus:ring-primary-500 py-1.5"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Items Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Calculator size={18} className="text-primary-600" />
                        Line Items
                    </h3>
                    <button
                        type="button"
                        onClick={() => append({ description: '', quantity: 1, rate: 0, taxRate: 0 })}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                    >
                        <Plus size={16} /> Add Item
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/30 text-left">
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Item Description</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase w-32">Qty</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase w-40">Rate</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase w-32">Tax %</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase w-40 text-right">Amount</th>
                                <th className="px-6 py-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {fields.map((field, index) => (
                                <tr key={field.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <input
                                            {...register(`items.${index}.description`)}
                                            placeholder="Service or Product name"
                                            className="w-full border-none bg-transparent focus:ring-0 text-sm placeholder-gray-400"
                                        />
                                        {errors.items?.[index]?.description && (
                                            <span className="text-[10px] text-red-500">{errors.items[index]?.description?.message}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            step="any"
                                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                            className="w-full border-gray-100 rounded-md text-sm focus:ring-primary-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            step="any"
                                            {...register(`items.${index}.rate`, { valueAsNumber: true })}
                                            className="w-full border-gray-100 rounded-md text-sm focus:ring-primary-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            step="any"
                                            {...register(`items.${index}.taxRate`, { valueAsNumber: true })}
                                            className="w-full border-gray-100 rounded-md text-sm focus:ring-primary-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                        {formatCurrency((watchItems[index]?.quantity || 0) * (watchItems[index]?.rate || 0))}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {fields.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
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
                {/* Notes & Terms */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes / Message to Client</label>
                        <textarea
                            {...register('notes')}
                            rows={3}
                            className="w-full rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            placeholder="Thank you for your business!"
                        />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</label>
                        <textarea
                            {...register('terms')}
                            rows={3}
                            className="w-full rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            placeholder="Payment is due within 30 days."
                        />
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-gray-400">
                            <span className="text-sm">Subtotal</span>
                            <span className="font-medium text-white">{formatCurrency(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400">
                            <span className="text-sm">Total Tax</span>
                            <span className="font-medium text-white">{formatCurrency(totals.totalTax)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-sm text-gray-400">Discount</span>
                            <div className="w-32 flex items-center bg-gray-800 rounded-md px-2 border border-gray-700">
                                <span className="text-xs text-gray-500 mr-1">-</span>
                                <input
                                    type="number"
                                    {...register('discount', { valueAsNumber: true })}
                                    className="bg-transparent border-none focus:ring-0 text-sm text-right w-full text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 mt-8 border-t border-gray-800">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1">Grand Total</p>
                                <h2 className="text-4xl font-extrabold">{formatCurrency(totals.total)}</h2>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-800/50 px-3 py-1.5 rounded-full">
                                <Info size={12} />
                                Calculated in {watch('currency')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-6 py-3 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                    Discard Changes
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-3 rounded-lg bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                    {loading ? <LoadingSpinner size="sm" /> : `Save ${watchType === 'quotation' ? 'Quotation' : 'Invoice'}`}
                </button>
            </div>
        </form>
    );
}
