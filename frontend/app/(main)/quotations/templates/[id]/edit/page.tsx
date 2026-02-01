'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCurrency } from '@/context/CurrencyContext';
import { Plus, Trash2, Save, ArrowLeft, Calculator, FileText, LayoutTemplate, Briefcase } from 'lucide-react';
import ProductSelector from '@/components/quotations/ProductSelector';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';
import Link from 'next/link';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { MultiSelect } from '@/components/ui/MultiSelect';

export default function EditQuotationTemplatePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();
    const { formatCurrency, currency: globalCurrency } = useCurrency();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Settings Data
    const [taxRates, setTaxRates] = useState<any[]>([]);
    const [unitTypes, setUnitTypes] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        title: '',
        description: '', // templateDescription
        paymentTerms: '',
        deliveryTerms: '',
        notes: '',
    });

    // Enhanced Item Interface
    interface TemplateItem {
        description: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        hsnSacCode: string;
        taxRateIds: string[];
        discount: number;
        tax?: number; // Legacy support
    }

    const [items, setItems] = useState<TemplateItem[]>([
        { description: '', quantity: 1, unit: '', unitPrice: 0, hsnSacCode: '', taxRateIds: [], discount: 0 }
    ]);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (params.id) {
            loadTemplate(params.id);
        }
    }, [params.id]);

    const fetchSettings = async () => {
        try {
            const [taxesRes, unitsRes] = await Promise.all([
                api.get('/settings/taxes'),
                api.get('/settings/units')
            ]);
            setTaxRates(taxesRes.data);
            setUnitTypes(unitsRes.data);
        } catch (error) {
            console.error('Failed to load settings', error);
        }
    };

    const loadTemplate = async (id: string) => {
        try {
            const res = await api.get(`/quotation-templates/${id}`);
            const t = res.data.template;

            setFormData({
                name: t.name,
                category: t.category || '',
                title: t.title,
                description: t.templateDescription || '',
                paymentTerms: t.paymentTerms || '',
                deliveryTerms: t.deliveryTerms || '',
                notes: t.notes || ''
            });

            if (t.items && t.items.length > 0) {
                // Map legacy items to new structure if needed
                const mappedItems = t.items.map((item: any) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    unit: item.unit || '',
                    hsnSacCode: item.hsnSacCode || '',
                    discount: item.discount || 0,
                    // If taxRateIds exists use it, otherwise try to map legacy 'tax' field if possible, or default to empty
                    taxRateIds: item.taxRateIds || [],
                    // Keep legacy tax for reference if needed, though we won't use it for calc if taxRateIds are present
                    tax: item.tax
                }));
                setItems(mappedItems);
            }
        } catch (error) {
            toast.error('Failed to load template');
            router.push('/quotations/templates');
        } finally {
            setLoading(false);
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
        const newItem: TemplateItem = {
            description: product.name,
            quantity: 1,
            unit: product.unit || '',
            unitPrice: product.price,
            hsnSacCode: product.hsnSacCode || '',
            taxRateIds: product.taxRateIds || [],
            discount: 0
        };

        if (emptyIndex !== -1) {
            const newItems = [...items];
            newItems[emptyIndex] = newItem;
            setItems(newItems);
        } else {
            setItems([...items, newItem]);
        }
        toast.success(`Added ${product.name}`);
    };

    const calculateTotal = () => {
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        items.forEach(item => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemDiscount = (itemSubtotal * (item.discount || 0)) / 100;
            const taxableAmount = itemSubtotal - itemDiscount;

            let itemTax = 0;
            if (item.taxRateIds && item.taxRateIds.length > 0) {
                (item.taxRateIds || []).forEach(taxId => {
                    const taxConfig = taxRates.find(t => t.id === taxId);
                    if (taxConfig) {
                        const taxAmount = taxableAmount * (Number(taxConfig.percentage) / 100);
                        itemTax += taxAmount;
                    }
                });
            } else if (item.tax) {
                // Fallback for legacy items without taxRateIds but with tax %
                itemTax = (taxableAmount * item.tax) / 100;
            }

            subtotal += itemSubtotal;
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

        if (!formData.name || !formData.title) {
            toast.error('Please fill required fields (Name and Proposal Title)');
            return;
        }

        if (validItems.length === 0) {
            toast.error('Please add at least one valid item line');
            return;
        }

        try {
            setSaving(true);
            await api.put(`/quotation-templates/${params.id}`, {
                name: formData.name,
                category: formData.category,
                title: formData.title,
                templateDescription: formData.description,
                paymentTerms: formData.paymentTerms,
                deliveryTerms: formData.deliveryTerms,
                notes: formData.notes,
                items: validItems
            });
            toast.success('Template updated successfully');
            router.push('/quotations/templates');
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to update template';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const totals = calculateTotal();

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <LoadingSpinner size="lg" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <PageHeader
                title="Edit Quotation Template"
                subtitle="Modify reusable proposal structure"
                icon={LayoutTemplate}
                actions={
                    <div className="flex gap-3">
                        <Link
                            href="/quotations/templates"
                            className="ent-button-secondary gap-2"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Cancel
                        </Link>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="ent-button-primary gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Update Template'}
                        </button>
                    </div>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">

                {/* Meta Data */}
                <div className="ent-card">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <Briefcase className="w-5 h-5 text-primary-600" />
                        </div>
                        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                            Template Details
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="ent-label">Template Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="ent-input font-bold"
                                placeholder="E.g. Web Development Standard"
                            />
                        </div>
                        <div>
                            <label className="ent-label">Category</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="ent-input"
                                placeholder="E.g. Software / Marketing"
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="ent-card">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                            Proposal Content
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="ent-label">Default Proposal Title <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="ent-input w-full md:w-1/2"
                                placeholder="E.g. Project Proposal For..."
                            />
                        </div>
                        <div>
                            <label className="ent-label mb-2 block">Scope of Work / Introduction (Rich Text)</label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(val) => setFormData(prev => prev.description === val ? prev : { ...prev, description: val })}
                                placeholder="Executive summary, scope details..."
                                className="min-h-[200px]"
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
                                Add Item
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider w-4/12">Description</th>
                                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-wider w-1/12">Qty</th>
                                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-wider w-1/12">UoM</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-wider w-2/12">Unit Price</th>
                                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-wider w-1/12">HSN/SAC</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-wider w-2/12">Tax Rule</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-wider w-1/12">Net Amount</th>
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
                                                placeholder="HSN"
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
                                            {formatCurrency((item.quantity * item.unitPrice))}
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
                                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-wide">Total Value</span>
                                    <span className="text-xl font-black text-primary-700 tracking-tight">{formatCurrency(totals.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terms */}
                <div className="ent-card">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                            Terms & Conditions
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="ent-label block mb-2">Payment Terms</label>
                            <RichTextEditor
                                value={formData.paymentTerms}
                                onChange={(val) => setFormData(prev => prev.paymentTerms === val ? prev : { ...prev, paymentTerms: val })}
                                className="min-h-[150px]"
                            />
                        </div>
                        <div>
                            <label className="ent-label block mb-2">Delivery Terms</label>
                            <RichTextEditor
                                value={formData.deliveryTerms}
                                onChange={(val) => setFormData(prev => prev.deliveryTerms === val ? prev : { ...prev, deliveryTerms: val })}
                                className="min-h-[150px]"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="ent-label block mb-2">Internal Notes</label>
                            <RichTextEditor
                                value={formData.notes}
                                onChange={(val) => setFormData(prev => prev.notes === val ? prev : { ...prev, notes: val })}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
}
