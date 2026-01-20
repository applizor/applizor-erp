'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { clientsApi } from '@/lib/api/clients';
import { invoicesApi } from '@/lib/api/invoices';
import { useCurrency } from '@/context/CurrencyContext';

export default function CreateInvoicePage() {
    const toast = useToast();
    const router = useRouter();
    const { currency } = useCurrency(); // Get global currency
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        type: 'invoice', // invoice, quotation, proforma
        clientId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: currency || 'USD',
        items: [{ description: '', hsnCode: '', quantity: 1, rate: 0, taxRate: 0, amount: 0 }],
        notes: '',
        terms: '',
    });

    useEffect(() => {
        // Update form currency if global currency changes and form is still pristine (optional, but good for initial load)
        if (currency && formData.currency !== currency) {
            setFormData(prev => ({ ...prev, currency }));
        }
    }, [currency]);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const response = await clientsApi.getAll({ limit: 100 });
            setClients(response.clients || []);
        } catch (error) {
            console.error('Failed to load clients');
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', hsnCode: '', quantity: 1, rate: 0, taxRate: 0, amount: 0 }],
        });
    };

    const removeItem = (index: number) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        // Recalculate amount
        const qty = Number(newItems[index].quantity) || 0;
        const rate = Number(newItems[index].rate) || 0;
        newItems[index].amount = qty * rate;
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let totalTax = 0;

        formData.items.forEach(item => {
            const amount = Number(item.amount) || 0;
            const taxRate = Number(item.taxRate) || 0;
            subtotal += amount;
            totalTax += amount * (taxRate / 100);
        });

        return {
            subtotal,
            totalTax,
            total: subtotal + totalTax
        };
    };

    const totals = calculateTotals();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                tax: totals.totalTax, // Sending total tax for backward compatibility/summary
                items: formData.items.map(item => ({
                    ...item,
                    quantity: Number(item.quantity),
                    rate: Number(item.rate),
                    taxRate: Number(item.taxRate)
                }))
            };

            await invoicesApi.create(payload);
            router.push('/invoices');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create document');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    Create {formData.type === 'quotation' ? 'Quotation' : formData.type === 'proforma' ? 'Proforma Invoice' : 'Invoice'}
                </h1>

                <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
                    {/* Top Row: Type, Client, Currency */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Document Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="invoice">Tax Invoice</option>
                                <option value="quotation">Quotation / Estimate</option>
                                <option value="proforma">Proforma Invoice</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Client</label>
                            <select
                                required
                                value={formData.clientId}
                                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="">Select Client</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Currency</label>
                            <select
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.invoiceDate}
                                onChange={e => setFormData({ ...formData, invoiceDate: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{formData.type === 'quotation' ? 'Valid Until' : 'Due Date'}</label>
                            <input
                                type="date"
                                required
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
                        <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item / Description</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">HSN/SAC</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Qty</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Rate</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Tax %</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">Amount</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {formData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="text"
                                                    required
                                                    value={item.description}
                                                    onChange={e => updateItem(index, 'description', e.target.value)}
                                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                    placeholder="Item name"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="text"
                                                    value={item.hsnCode}
                                                    onChange={e => updateItem(index, 'hsnCode', e.target.value)}
                                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    required
                                                    min="0.01"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(index, 'quantity', e.target.value)}
                                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    value={item.rate}
                                                    onChange={e => updateItem(index, 'rate', e.target.value)}
                                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    value={item.taxRate}
                                                    onChange={e => updateItem(index, 'taxRate', e.target.value)}
                                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm text-gray-900">
                                                {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                {formData.items.length > 1 && (
                                                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
                                                        &times;
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button type="button" onClick={addItem} className="mt-2 text-sm text-primary-600 font-medium hover:text-primary-800">
                            + Add Line Item
                        </button>
                    </div>

                    {/* Footer: Notes & Totals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Notes / Payment Instructions</label>
                                <textarea
                                    rows={3}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
                                <textarea
                                    rows={3}
                                    value={formData.terms}
                                    onChange={e => setFormData({ ...formData, terms: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="e.g. Payment due within 15 days."
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {formData.currency}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Total Tax</span>
                                <span>{totals.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })} {formData.currency}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-lg text-gray-900">
                                <span>Grand Total</span>
                                <span>{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} {formData.currency}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : `Save ${formData.type === 'quotation' ? 'Quotation' : 'Invoice'}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
