'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Edit2, Trash2, XCircle, Search, Mail, Receipt, AlertCircle, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useCurrency } from '@/context/CurrencyContext';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';
import { useConfirm } from '@/context/ConfirmationContext';

export default function MembershipsPage() {
    const { formatCurrency } = useCurrency();
    const toast = useToast();
    const { can, user } = usePermission();
    const { confirm } = useConfirm();

    // Page-level check
    if (user && !can('Subscription', 'read')) {
        return <AccessDenied />;
    }

    // Data lists
    const [memberships, setMemberships] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter/Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMembership, setEditingMembership] = useState<any>(null);

    // Form inputs state
    const [clientId, setClientId] = useState('');
    const [name, setName] = useState('');
    const [plan, setPlan] = useState('');
    const [amount, setAmount] = useState('');
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('active');
    const [currency, setCurrency] = useState('INR');

    // Fetch memberships and clients on mount
    const loadData = async () => {
        try {
            setLoading(true);
            const [memRes, clientRes] = await Promise.all([
                api.get('/subscriptions'),
                api.get('/clients')
            ]);

            setMemberships(memRes.data?.subscriptions || []);
            setClients(Array.isArray(clientRes.data) ? clientRes.data : (clientRes.data?.clients || []));
        } catch (error) {
            toast.error('Failed to load memberships or clients database');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setClientId('');
        setName('');
        setPlan('');
        setAmount('');
        setBillingCycle('monthly');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setStatus('active');
        setCurrency('INR');
        setEditingMembership(null);
    };

    const handleEdit = (mem: any) => {
        setEditingMembership(mem);
        setClientId(mem.clientId);
        setName(mem.name);
        setPlan(mem.plan);
        setAmount(String(mem.amount));
        setBillingCycle(mem.billingCycle || 'monthly');
        setStartDate(mem.startDate ? new Date(mem.startDate).toISOString().split('T')[0] : '');
        setEndDate(mem.endDate ? new Date(mem.endDate).toISOString().split('T')[0] : '');
        setStatus(mem.status || 'active');
        setCurrency(mem.currency || 'INR');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) {
            toast.error('Please select a client');
            return;
        }

        try {
            const payload = {
                clientId,
                name,
                plan,
                amount: Number(amount),
                billingCycle,
                startDate,
                endDate: endDate || null,
                status,
                currency
            };

            if (editingMembership) {
                await api.put(`/subscriptions/${editingMembership.id}`, payload);
                toast.success('Membership updated successfully');
            } else {
                await api.post('/subscriptions', payload);
                toast.success('Client enrolled in membership successfully');
            }

            setIsModalOpen(false);
            resetForm();
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to register membership');
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ message: 'Are you sure you want to delete/cancel this membership?', type: 'danger' })) return;
        try {
            await api.delete(`/subscriptions/${id}`);
            toast.success('Membership cancelled');
            loadData();
        } catch (error) {
            toast.error('Failed to cancel membership');
        }
    };

    const handleQuickInvoice = async (mem: any) => {
        try {
            // Generate quick invoice payload based on membership details
            const invoicePayload = {
                clientId: mem.clientId,
                invoiceDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                currency: mem.currency || 'INR',
                items: [
                    {
                        description: `Renewal Fee for ${mem.name} (${mem.plan})`,
                        quantity: 1,
                        rate: Number(mem.amount),
                        discount: 0,
                        taxRateIds: []
                    }
                ],
                notes: `Automatically generated billing cycle invoice for client membership plan: ${mem.name}.`
            };

            const response = await api.post('/invoices', invoicePayload);
            toast.success(`Quick Invoice ${response.data.invoice?.invoiceNumber || ''} created successfully!`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to generate quick invoice');
        }
    };

    const handleNotifyClient = async (mem: any) => {
        if (!mem.client?.email) {
            toast.error('This client does not have a registered email address');
            return;
        }

        try {
            const body = {
                to: mem.client.email,
                subject: `Membership Renewal Notice: ${mem.name}`,
                body: `Dear ${mem.client.name},\n\nThis is a notification regarding your membership "${mem.name}" (${mem.plan}). Your next billing cycle renewal of ${formatCurrency(mem.amount)} is scheduled on ${mem.nextBillingDate ? new Date(mem.nextBillingDate).toLocaleDateString() : 'N/A'}.\n\nIf you have any questions, please reach out to our team.\n\nBest Regards.`
            };

            await api.post('/emails/send-raw', body);
            toast.success('Polite notification dispatched successfully!');
        } catch (error: any) {
            toast.error('Dispatch failed or email server integration is not set up');
        }
    };

    // Filters
    const filteredMemberships = memberships.filter(m => {
        const matchesSearch =
            (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.plan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.client?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.client?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === '' || m.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Statistics
    const activeCount = memberships.filter(m => m.status === 'active').length;
    const expiredCount = memberships.filter(m => m.status === 'expired' || (m.endDate && new Date(m.endDate) < new Date())).length;
    const totalRevenue = memberships.reduce((acc, curr) => acc + (curr.status === 'active' ? Number(curr.amount) : 0), 0);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-lg font-black text-gray-900 uppercase">Client Memberships & Subscriptions</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Enroll, track status, generate recurring cycles and auto-renewals</p>
                </div>
                {can('Subscription', 'create') && (
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={14} /> Enroll Client
                    </button>
                )}
            </div>

            {/* Premium Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-md border border-slate-200 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Enrollment</span>
                        <p className="text-2xl font-black text-slate-800">{activeCount}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-md border border-slate-200 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 flex-shrink-0">
                        <Clock size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Expired / Ending soon</span>
                        <p className="text-2xl font-black text-slate-800">{expiredCount}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-md border border-slate-200 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100 flex-shrink-0">
                        <Receipt size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Monthly Valuation</span>
                        <p className="text-2xl font-black text-slate-800">{formatCurrency(totalRevenue)}</p>
                    </div>
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by client name, membership, or plan..."
                        className="ent-input pl-10 w-full"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-48">
                    <CustomSelect
                        placeholder="All Statuses"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { label: 'All Statuses', value: '' },
                            { label: 'Active', value: 'active' },
                            { label: 'Cancelled', value: 'cancelled' },
                            { label: 'Expired', value: 'expired' }
                        ]}
                    />
                </div>
            </div>

            {/* Table layout */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                    <div className="ent-table-container">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-100 bg-slate-50">
                                    <th className="px-6 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/4">Client Name</th>
                                    <th className="px-6 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Plan & Membership</th>
                                    <th className="px-6 py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Billing amount</th>
                                    <th className="px-6 py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Billing cycle</th>
                                    <th className="px-6 py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Next Run Date</th>
                                    <th className="px-6 py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredMemberships.map((mem) => {
                                    const isExpired = mem.status === 'expired' || (mem.endDate && new Date(mem.endDate) < new Date());

                                    return (
                                        <tr key={mem.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-gray-900">{mem.client?.name}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{mem.client?.companyName || 'No Company'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-black text-primary-700 uppercase tracking-wider">{mem.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold">{mem.plan}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <p className="text-xs font-bold text-slate-800">{formatCurrency(mem.amount)}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 font-extrabold uppercase px-2 py-0.5 rounded">
                                                    {mem.billingCycle}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs font-semibold text-slate-600">
                                                {mem.nextBillingDate ? new Date(mem.nextBillingDate).toLocaleDateString() : '--'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded inline-block ${
                                                    isExpired ? 'bg-red-50 text-red-600 border border-red-100' :
                                                    mem.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                    'bg-yellow-50 text-yellow-600 border border-yellow-100'
                                                }`}>
                                                    {isExpired ? 'Expired' : mem.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {can('Invoice', 'create') && (
                                                        <button
                                                            onClick={() => handleQuickInvoice(mem)}
                                                            title="Quick generate renewal invoice"
                                                            className="p-1.5 bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
                                                        >
                                                            <Receipt size={14} />
                                                        </button>
                                                    )}
                                                    {can('Subscription', 'update') && (
                                                        <button
                                                            onClick={() => handleNotifyClient(mem)}
                                                            title="Send renewal follow-up reminder email"
                                                            className="p-1.5 bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
                                                        >
                                                            <Mail size={14} />
                                                        </button>
                                                    )}
                                                    {can('Subscription', 'update') && (
                                                        <button
                                                            onClick={() => handleEdit(mem)}
                                                            title="Edit membership details"
                                                            className="p-1.5 bg-slate-100 border border-slate-200 text-slate-600 hover:bg-primary-50 hover:text-primary-700 rounded transition-colors"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}
                                                    {can('Subscription', 'delete') && (
                                                        <button
                                                            onClick={() => handleDelete(mem.id)}
                                                            title="Delete membership"
                                                            className="p-1.5 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredMemberships.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center p-12 text-slate-400 font-bold text-xs">
                                            No client membership configurations found matching filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add / Edit Enrollment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-sm font-black uppercase text-gray-900">
                                {editingMembership ? 'Modify Membership Details' : 'Enroll Client in Membership'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-gray-900">
                                <XCircle size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Target Client</label>
                                    <CustomSelect
                                        placeholder="Choose a client..."
                                        value={clientId}
                                        onChange={setClientId}
                                        options={clients.map(c => ({ label: `${c.name} (${c.companyName || 'No Company'})`, value: c.id }))}
                                    />
                                </div>

                                <div className="ent-form-group">
                                    <label className="ent-label">Membership/Category Title</label>
                                    <input
                                        type="text"
                                        className="ent-input"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        placeholder="e.g. Gold Subscription"
                                    />
                                </div>

                                <div className="ent-form-group">
                                    <label className="ent-label">Tier / Description Identifier</label>
                                    <input
                                        type="text"
                                        className="ent-input"
                                        value={plan}
                                        onChange={e => setPlan(e.target.value)}
                                        required
                                        placeholder="e.g. Premium Tier"
                                    />
                                </div>

                                <div className="ent-form-group">
                                    <label className="ent-label">Billing Amount</label>
                                    <input
                                        type="number"
                                        className="ent-input"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        required
                                        placeholder="5000"
                                    />
                                </div>

                                <div className="ent-form-group">
                                    <label className="ent-label">Billing Cycle</label>
                                    <CustomSelect
                                        value={billingCycle}
                                        onChange={setBillingCycle}
                                        options={[
                                            { label: 'Monthly Cycle', value: 'monthly' },
                                            { label: 'Quarterly Cycle', value: 'quarterly' },
                                            { label: 'Yearly Cycle', value: 'yearly' }
                                        ]}
                                    />
                                </div>

                                <div className="ent-form-group">
                                    <label className="ent-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="ent-input"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="ent-form-group">
                                    <label className="ent-label">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="ent-input"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>

                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Membership Status</label>
                                    <CustomSelect
                                        value={status}
                                        onChange={setStatus}
                                        options={[
                                            { label: 'Active Status', value: 'active' },
                                            { label: 'Cancelled Status', value: 'cancelled' },
                                            { label: 'Expired Status', value: 'expired' }
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="btn-primary w-full py-3">
                                    {editingMembership ? 'Save Changes' : 'Confirm Enrollment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
