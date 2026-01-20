'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCurrency } from '@/context/CurrencyContext';
import { Plus, Trash2, Calendar, FileText, ArrowLeft, Save } from 'lucide-react';
import ProductSelector from '@/components/quotations/ProductSelector';
import api from '@/lib/api';
import { quotationsApi } from '@/lib/api/quotations';

export default function EditQuotationPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();

    const { can } = usePermission();
    const { formatCurrency, currency: globalCurrency } = useCurrency();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        leadId: '',
        title: '',
        description: '',
        validUntil: '',
        paymentTerms: '',
        deliveryTerms: '',
        notes: '',
        currency: globalCurrency
    });

    const [items, setItems] = useState<any[]>([
        { description: '', quantity: 1, unitPrice: 0, tax: 18, discount: 0 }
    ]);

    useEffect(() => {
        if (!can('Quotation', 'update')) {
            toast.error('Access denied');
            router.push('/quotations');
            return;
        }

        const loadData = async () => {
            try {
                const [leadsRes, quotationData] = await Promise.all([
                    api.get('/leads'),
                    quotationsApi.getById(params.id)
                ]);

                setLeads(leadsRes.data.leads || []);

                const q = quotationData.quotation;
                if (!q) {
                    toast.error('Quotation not found');
                    router.push('/quotations');
                    return;
                }

                if (q.status !== 'draft') {
                    toast.error('Only draft quotations can be edited');
                    router.push(`/quotations/${params.id}`);
                    return;
                }

                setFormData({
                    leadId: q.leadId || q.clientId || '',
                    title: q.title,
                    description: q.description || '',
                    validUntil: q.validUntil ? new Date(q.validUntil).toISOString().split('T')[0] : '',
                    paymentTerms: q.paymentTerms || '',
                    deliveryTerms: q.deliveryTerms || '',
                    notes: q.notes || '',
                    currency: globalCurrency
                });

                if (q.items && q.items.length > 0) {
                    setItems(q.items.map((item: any) => ({
                        description: item.description,
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unitPrice),
                        tax: Number(item.tax),
                        discount: Number(item.discount)
                    })));
                }

            } catch (error) {
                console.error('Failed to load data', error);
                toast.error('Failed to load quotation data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [params.id, can, router, toast, globalCurrency]);

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0, tax: 18, discount: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleProductSelect = (product: any) => {
        const emptyIndex = items.findIndex(i => i.description === '' && i.unitPrice === 0);

        if (emptyIndex !== -1) {
            const newItems = [...items];
            newItems[emptyIndex] = {
                description: product.name,
                quantity: 1,
                unitPrice: product.price,
                tax: product.tax,
                discount: 0
            };
            setItems(newItems);
        } else {
            setItems([...items, {
                description: product.name,
                quantity: 1,
                unitPrice: product.price,
                tax: product.tax,
                discount: 0
            }]);
        }
        toast.success(`Added ${product.name}`);
    };

    const calculateTotal = () => {
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        items.forEach(item => {
            const itemTotal = item.quantity * item.unitPrice;
            const itemTax = (itemTotal * item.tax) / 100;
            const itemDiscount = (itemTotal * item.discount) / 100;

            subtotal += itemTotal;
            totalTax += itemTax;
            totalDiscount += itemDiscount;
        });

        return {
            subtotal,
            tax: totalTax,
            discount: totalDiscount,
            total: subtotal + totalTax - totalDiscount
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validItems = items.filter(item => item.description.trim() !== '' && item.quantity > 0);

        if (!formData.leadId || !formData.title) {
            toast.error('Please fill all required fields (Client and Title)');
            return;
        }

        if (validItems.length === 0) {
            toast.error('Please add at least one valid item line');
            return;
        }

        try {
            setSaving(true);
            await quotationsApi.update(params.id, {
                ...formData,
                items: validItems.map(item => ({
                    ...item,
                    total: item.quantity * item.unitPrice
                }))
            } as any); // Type assertion needed due to complex Partial<Quotation> 
            toast.success('Quotation updated successfully');
            router.push(`/quotations/${params.id}`);
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to update quotation';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const totals = calculateTotal();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </button>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit Quotation</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-8 space-y-8">
                    {/* Header Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Client / Lead <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.leadId}
                                onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-4 py-2.5 bg-gray-50 focus:bg-white transition focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Select Lead or Client</option>
                                {leads.map(lead => (
                                    <option key={lead.id} value={lead.id}>
                                        {lead.name} {lead.company ? `- ${lead.company}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex space-x-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valid Until <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="date"
                                        required
                                        value={formData.validUntil}
                                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                        className="w-full pl-10 border border-gray-300 rounded-md px-4 py-2.5 bg-gray-50 focus:bg-white transition focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="w-1/3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 bg-white"
                                >
                                    <option value="INR">INR (₹)</option>
                                    <option value="USD">USD ($)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100"></div>

                    {/* Title & Desc */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quotation Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Items Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Line Items</h3>
                            <div className="flex items-center space-x-3">
                                <ProductSelector onSelect={handleProductSelect} />
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-md text-sm font-medium hover:bg-primary-100 transition flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Custom Item
                                </button>
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-5/12">Description</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/12">Qty</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-2/12">Price</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/12">Tax %</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-2/12">Total</th>
                                        <th className="px-4 py-3 w-1/12"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                    className="w-full border-0 border-b border-transparent focus:border-primary-500 focus:ring-0 p-0 text-sm bg-transparent"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                                    className="w-full border-0 border-b border-transparent focus:border-primary-500 focus:ring-0 p-0 text-sm bg-transparent"
                                                    min="1"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                                                    className="w-full border-0 border-b border-transparent focus:border-primary-500 focus:ring-0 p-0 text-sm bg-transparent"
                                                    min="0"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.tax}
                                                    onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value))}
                                                    className="w-full border-0 border-b border-transparent focus:border-primary-500 focus:ring-0 p-0 text-sm bg-transparent text-gray-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {formatCurrency((item.quantity * item.unitPrice))}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="text-gray-400 hover:text-red-500 transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Section */}
                        <div className="flex justify-end">
                            <div className="w-full md:w-1/3 bg-gray-50 rounded-lg p-6 space-y-3">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Total Tax:</span>
                                    <span>{formatCurrency(totals.tax)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Total Discount:</span>
                                    <span>-{formatCurrency(totals.discount)}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-base font-bold text-gray-900">Grand Total</span>
                                    <span className="text-xl font-bold text-primary-700">{formatCurrency(totals.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="grid grid-cols-2 gap-8 pt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                            <textarea
                                value={formData.paymentTerms}
                                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Terms</label>
                            <textarea
                                value={formData.deliveryTerms}
                                onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                rows={3}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            rows={2}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-8 py-5 flex justify-end items-center space-x-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 bg-primary-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center transition"
                    >
                        {saving && <LoadingSpinner size="sm" className="mr-2" />}
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
