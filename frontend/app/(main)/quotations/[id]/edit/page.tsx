'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCurrency } from '@/context/CurrencyContext';
import { Plus, Trash2, Calendar, FileText, ArrowLeft, Save, Copy, Clock, DollarSign, Users, Briefcase, Calculator } from 'lucide-react';
import ProductSelector from '@/components/quotations/ProductSelector';
import { quotationsApi } from '@/lib/api/quotations';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { MultiSelect } from '@/components/ui/MultiSelect';

export default function EditQuotationPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();

    const { can, user } = usePermission();
    const { formatCurrency, currency: globalCurrency } = useCurrency();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
    const [templateFormData, setTemplateFormData] = useState({ name: '', category: '' });
    const [taxRates, setTaxRates] = useState<any[]>([]);
    const [unitTypes, setUnitTypes] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        leadId: '',
        title: '',
        description: '',
        validUntil: '',
        paymentTerms: '',
        deliveryTerms: '',
        notes: '',
        currency: globalCurrency,
        reminderFrequency: '',
        maxReminders: 3,
        discount: 0
    });

    const [items, setItems] = useState<any[]>([
        { description: '', quantity: 1, unit: '', unitPrice: 0, taxRateIds: [] as string[], discount: 0 }
    ]);

    useEffect(() => {
        if (user === null) return;

        if (!can('Quotation', 'update')) {
            toast.error('Access denied');
            router.push('/quotations');
            return;
        }

        const loadData = async () => {
            try {
                const [leadsRes, templatesRes, taxesRes, unitsRes, quotationData] = await Promise.all([
                    api.get('/leads'),
                    api.get('/quotation-templates'),
                    api.get('/settings/taxes'),
                    api.get('/settings/units'),
                    quotationsApi.getById(params.id)
                ]);

                setLeads(leadsRes.data.leads || []);
                setTemplates(templatesRes.data.templates || []);
                setTaxRates(taxesRes.data || []);
                setUnitTypes(unitsRes.data || []);

                const q = quotationData.quotation;
                if (!q) {
                    toast.error('Quotation not found');
                    router.push('/quotations');
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
                    currency: q.currency || globalCurrency,
                    reminderFrequency: q.reminderFrequency || '',
                    maxReminders: q.maxReminders || 3,
                    discount: Number(q.discount || 0)
                });

                if (q.items && q.items.length > 0) {
                    setItems(q.items.map((item: any) => ({
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit: item.unit || '',
                        unitPrice: Number(item.unitPrice),
                        hsnSacCode: item.hsnSacCode || '',
                        taxRateIds: item.appliedTaxes ? item.appliedTaxes.map((t: any) => t.taxRateId) : (item.taxRateId ? [item.taxRateId] : []),
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
    }, [params.id, can, user, router, toast, globalCurrency]);

    const applyTemplate = async (templateId: string) => {
        if (!templateId) return;

        try {
            const response = await api.post(`/quotation-templates/${templateId}/apply`);
            const template = response.data.template;

            setFormData({
                ...formData,
                title: template.title,
                description: template.templateDescription,
                paymentTerms: template.paymentTerms || formData.paymentTerms,
                deliveryTerms: template.deliveryTerms || formData.deliveryTerms,
                notes: template.notes || formData.notes
            });

            if (template.items && Array.isArray(template.items)) {
                setItems(template.items);
            }

            toast.success('Template applied successfully');
        } catch (error: any) {
            toast.error('Failed to apply template');
        }
    };

    const saveAsTemplate = async () => {
        if (!formData.title) {
            toast.error('Please enter a quotation title first');
            return;
        }

        setTemplateFormData({ name: formData.title, category: '' });
        setShowSaveTemplateDialog(true);
    };

    const handleSaveTemplate = async () => {
        if (!templateFormData.name) {
            toast.error('Please enter template name');
            return;
        }

        try {
            await api.post('/quotation-templates', {
                name: templateFormData.name,
                category: templateFormData.category || undefined,
                title: formData.title,
                templateDescription: formData.description,
                paymentTerms: formData.paymentTerms,
                deliveryTerms: formData.deliveryTerms,
                notes: formData.notes,
                items: items
            });

            toast.success('Template saved successfully');
            setShowSaveTemplateDialog(false);
            const templatesRes = await api.get('/quotation-templates');
            setTemplates(templatesRes.data.templates || []);
        } catch (error: any) {
            toast.error('Failed to save template');
        }
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unit: '', unitPrice: 0, hsnSacCode: '', taxRateIds: [], discount: 0 }]);
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
                unit: product.unit || '',
                unitPrice: product.price,
                hsnSacCode: product.hsnSacCode || '',
                taxRateIds: product.taxRateIds || [],
                discount: 0
            };
            setItems(newItems);
        } else {
            setItems([...items, {
                description: product.name,
                quantity: 1,
                unit: product.unit || '',
                unitPrice: product.price,
                taxRateIds: product.taxRateIds || [],
                discount: 0
            }]);
        }
        toast.success(`Added ${product.name}`);
    };

    const calculateTotal = () => {
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;
        const taxBreakdown: Record<string, number> = {};

        items.forEach(item => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemDiscount = (itemSubtotal * (item.discount || 0)) / 100;
            const taxableAmount = itemSubtotal - itemDiscount;

            let itemTax = 0;
            (item.taxRateIds || []).forEach((taxId: string) => {
                const taxConfig = taxRates.find(t => t.id === taxId);
                if (taxConfig) {
                    const taxAmount = taxableAmount * (Number(taxConfig.percentage) / 100);
                    itemTax += taxAmount;

                    // Aggregate for breakdown
                    const key = `${taxConfig.name} @${Number(taxConfig.percentage)}%`;
                    taxBreakdown[key] = (taxBreakdown[key] || 0) + taxAmount;
                }
            });

            subtotal += itemSubtotal;
            totalTax += itemTax;
            totalDiscount += itemDiscount;
        });

        return {
            subtotal,
            tax: totalTax,
            itemDiscount: totalDiscount,
            overallDiscount: Number(formData.discount || 0),
            total: subtotal + totalTax - totalDiscount - Number(formData.discount || 0),
            taxBreakdown
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
                discount: Number(formData.discount || 0), // Store ONLY the additional/global discount
                items: validItems.map(item => ({
                    ...item,
                    total: item.quantity * item.unitPrice
                }))
            } as any);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                    <Link
                        href={`/quotations/${params.id}`}
                        className="inline-flex items-center text-xs font-semibold text-primary-600 hover:text-primary-700 uppercase tracking-wider mb-2"
                    >
                        <ArrowLeft size={12} className="mr-1" />
                        Back to View
                    </Link>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                        Edit Proposal
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">
                        Modify your commercial offer
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {templates.length > 0 && (
                        <CustomSelect
                            options={templates.map(t => ({ label: t.name, value: t.id }))}
                            value={selectedTemplateId}
                            onChange={(val) => {
                                setSelectedTemplateId(val);
                                applyTemplate(val);
                            }}
                            placeholder="Load Template..."
                            className="min-w-[200px]"
                        />
                    )}
                    <Button
                        type="button"
                        onClick={saveAsTemplate}
                        variant="secondary"
                        icon={Save}
                    >
                        Save as Template
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Core Details */}
                <div className="ent-card">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <Briefcase className="w-5 h-5 text-primary-600" />
                        </div>
                        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                            Proposal Logistics
                        </h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Left Column */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Target Client / Lead <span className="text-red-500">*</span>
                                </label>
                                <CustomSelect
                                    options={leads.map(lead => ({
                                        label: `${lead.name} ${lead.company ? `- ${lead.company}` : ''}`,
                                        value: lead.id,
                                        description: lead.email
                                    }))}
                                    value={formData.leadId}
                                    onChange={(val) => setFormData({ ...formData, leadId: val })}
                                    placeholder="Select Lead or Client"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Proposal Title <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FileText className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="ent-input pl-10 w-full font-semibold"
                                        placeholder="e.g., Enterprise Licensed Software Agreement"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Validity Expiry <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="date"
                                            required
                                            value={formData.validUntil}
                                            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                            className="ent-input pl-10 w-full"
                                        />
                                    </div>
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Currency
                                    </label>
                                    <CustomSelect
                                        options={[
                                            { label: 'INR (₹)', value: 'INR' },
                                            { label: 'USD ($)', value: 'USD' },
                                            { label: 'EUR (€)', value: 'EUR' },
                                            { label: 'GBP (£)', value: 'GBP' }
                                        ]}
                                        value={formData.currency}
                                        onChange={(val) => setFormData({ ...formData, currency: val })}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Auto Follow Up */}
                            <div className="bg-amber-50 rounded-lg border border-amber-100 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center">
                                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                                        Auto-Follow Up
                                    </label>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded border border-amber-200 uppercase">Beta</span>
                                </div>
                                <div className="flex gap-3">
                                    <CustomSelect
                                        options={[
                                            { label: 'Disabled', value: '' },
                                            { label: 'Daily', value: 'DAILY' },
                                            { label: 'Every 3 Days', value: '3_DAYS' },
                                            { label: 'Weekly', value: 'WEEKLY' }
                                        ]}
                                        value={formData.reminderFrequency}
                                        onChange={(val) => setFormData({ ...formData, reminderFrequency: val })}
                                        className="w-full"
                                    />
                                    {formData.reminderFrequency && (
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={formData.maxReminders}
                                            onChange={(e) => setFormData({ ...formData, maxReminders: parseInt(e.target.value) })}
                                            className="block w-20 rounded-md border-amber-200 bg-white shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-xs py-1.5"
                                            title="Max Reminders"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Full Width Desc */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Scope of Work / Introduction
                            </label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(value) => setFormData({ ...formData, description: value })}
                                placeholder="Executive summary of the proposal scope..."
                            />
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="ent-card">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <Calculator className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                                Commercials
                            </h2>
                        </div>
                        <div className="flex items-center space-x-3">
                            <ProductSelector onSelect={handleProductSelect} />
                            <Button
                                type="button"
                                onClick={addItem}
                                variant="secondary"
                                icon={Plus}
                                className="text-xs"
                            >
                                Add Manual Item
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider w-3/12">Description</th>
                                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-wider w-1/12">Qty</th>
                                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-wider w-1/12">UoM</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-wider w-1/12">Unit Price</th>
                                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-wider w-1/12">HSN/SAC</th>
                                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-wider w-1/12">Disc %</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-wider w-2/12">Tax Rule</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-wider w-2/12">Net Amount</th>
                                    <th className="px-4 py-3 w-1/12"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {items.map((item, index) => (
                                    <tr key={index} className="group hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-2">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                className="block w-full border-0 border-b border-transparent bg-transparent focus:border-primary-500 focus:ring-0 text-sm font-medium placeholder-gray-300 transition-colors"
                                                placeholder="Item description"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                                className="block w-full border-0 border-b border-transparent bg-transparent focus:border-primary-500 focus:ring-0 text-sm text-center"
                                                min="1"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <CustomSelect
                                                options={unitTypes.map(u => ({ label: `${u.name} (${u.symbol})`, value: u.symbol }))}
                                                value={item.unit}
                                                onChange={(val) => updateItem(index, 'unit', val)}
                                                placeholder="-"
                                                className="w-full"
                                                align="right"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                                                className="block w-full border-0 border-b border-transparent bg-transparent focus:border-primary-500 focus:ring-0 text-sm text-right font-mono"
                                                min="0"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={item.hsnSacCode}
                                                onChange={(e) => updateItem(index, 'hsnSacCode', e.target.value)}
                                                className="block w-full border-0 border-b border-transparent bg-transparent focus:border-primary-500 focus:ring-0 text-sm text-center"
                                                placeholder="HSN/SAC"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={item.discount}
                                                onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value))}
                                                className="block w-full border-0 border-b border-transparent bg-transparent focus:border-rose-500 focus:ring-0 text-sm text-center text-rose-500 font-bold"
                                                min="0"
                                                max="100"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <MultiSelect
                                                options={taxRates.map(t => ({
                                                    label: `${t.name} (${Number(t.percentage)}%)`,
                                                    value: t.id,
                                                    description: `Rate: ${Number(t.percentage)}%`
                                                }))}
                                                value={item.taxRateIds || []}
                                                onChange={(val) => updateItem(index, 'taxRateIds', val)}
                                                placeholder="0%"
                                                className="w-full"
                                                align="right"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm font-bold text-gray-900 tracking-tight">
                                            {formatCurrency((item.quantity * item.unitPrice) * (1 - (item.discount || 0) / 100))}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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

                    <div className="bg-gray-50/50 border-t border-gray-100 p-6">
                        <div className="flex justify-end">
                            <div className="w-full md:w-1/3 space-y-3">
                                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    <span>Total Tax</span>
                                    <span>{formatCurrency(totals.tax)}</span>
                                </div>

                                {/* Detailed Tax Breakdown */}
                                {Object.entries(totals.taxBreakdown).map(([name, amount]) => (
                                    <div key={name} className="flex justify-between text-[10px] items-center text-gray-400 pl-2 border-l-2 border-slate-200">
                                        <span>{name}</span>
                                        <span>{formatCurrency(amount)}</span>
                                    </div>
                                ))}

                                <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    <span>Item Discounts</span>
                                    <span className="text-rose-500">-{formatCurrency(totals.itemDiscount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    <span>Additional Discount</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 font-normal">{formData.currency === 'INR' ? '₹' : (formData.currency === 'USD' ? '$' : (formData.currency === 'EUR' ? '€' : (formData.currency === 'GBP' ? '£' : formData.currency)))}</span>
                                        <input
                                            type="number"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                            className="w-24 text-right bg-white border border-gray-200 rounded px-1.5 py-0.5 text-rose-500 font-bold outline-none focus:border-rose-500"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-wide">Total Value</span>
                                    <span className="text-xl font-black text-primary-700 tracking-tight">{formatCurrency(totals.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terms & Conditions */}
                <div className="ent-card">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <FileText className="w-5 h-5 text-primary-600" />
                        </div>
                        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                            Terms & Conditions
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Payment Terms
                            </label>
                            <textarea
                                value={formData.paymentTerms}
                                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                className="ent-input w-full py-2"
                                rows={4}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Delivery / Fulfillment Terms
                            </label>
                            <textarea
                                value={formData.deliveryTerms}
                                onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                                className="ent-input w-full py-2"
                                rows={4}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Confidential Notes (Internal Only)
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="ent-input w-full py-2 bg-yellow-50 focus:bg-white transition-colors"
                                rows={2}
                                placeholder="Additional private notes related to this proposal..."
                            />
                            <p className="text-[10px] text-gray-400 mt-1 font-medium">* These notes are not visible to the client on the generated PDF.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={saving}
                        isLoading={saving}
                        variant="primary"
                        icon={Save}
                    >
                        Save Changes
                    </Button>
                </div>
            </form>

            {/* Save Template Dialog */}
            {showSaveTemplateDialog && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setShowSaveTemplateDialog(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-md text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-50 sm:mx-0 sm:h-10 sm:w-10">
                                        <Copy className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900 uppercase tracking-tight" id="modal-title">
                                            Save Template Configuration
                                        </h3>
                                        <div className="mt-4 space-y-4">
                                            <p className="text-sm text-gray-500">
                                                Persist this proposal structure as a reusable template for future operations.
                                            </p>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                                    Template Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={templateFormData.name}
                                                    onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                                                    className="ent-input w-full"
                                                    placeholder="e.g. Website Development Standard"
                                                    autoFocus
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                                    Category Tag (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={templateFormData.category}
                                                    onChange={(e) => setTemplateFormData({ ...templateFormData, category: e.target.value })}
                                                    className="ent-input w-full"
                                                    placeholder="e.g. Software Services"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                                <Button
                                    type="button"
                                    onClick={handleSaveTemplate}
                                    className="w-full sm:w-auto text-sm"
                                >
                                    Confirm Save
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowSaveTemplateDialog(false)}
                                    className="w-full sm:w-auto text-sm mt-3 sm:mt-0"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
