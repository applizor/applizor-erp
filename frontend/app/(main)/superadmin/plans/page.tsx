'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Plus, Edit2, Trash2, X, Check, CheckCircle2 } from 'lucide-react';

interface TenantPlan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: string;
  currency: string;
  billingInterval: string;
  maxUsers: number;
  maxStorageGb: number;
  maxCompanies: number;
  enabledModules: Record<string, boolean> | null;
  features: Record<string, boolean> | null;
  isActive: boolean;
  sortOrder: number;
}

const AVAILABLE_MODULES = [
  { key: 'hrms', label: 'HRMS (Core People, Attendance & Leaves)' },
  { key: 'payroll', label: 'Payroll Engine' },
  { key: 'clients', label: 'Clients Directory' },
  { key: 'invoices', label: 'Invoices & Billing' },
  { key: 'projects', label: 'Projects & Tasks' },
  { key: 'crm', label: 'CRM & Lead Pipeline' },
  { key: 'accounting', label: 'Chart of Accounts & Ledger' },
  { key: 'recruitment', label: 'Recruitment (ATS)' },
  { key: 'lms', label: 'LMS (Academy)' },
];

const AVAILABLE_FEATURES = [
  { key: 'apiAccess', label: 'Developer API Access' },
  { key: 'customBranding', label: 'Custom Branding (Logo/Branding)' },
  { key: 'prioritySupport', label: 'Priority Support Callback' },
  { key: 'aiFeatures', label: 'AI Center & Automation' },
  { key: 'whiteLabel', label: 'White-label Client Portals' },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<TenantPlan[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TenantPlan | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [maxUsers, setMaxUsers] = useState(5);
  const [maxStorageGb, setMaxStorageGb] = useState(1);
  const [maxCompanies, setMaxCompanies] = useState(1);
  const [sortOrder, setSortOrder] = useState(0);
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({});
  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, boolean>>({});

  const toast = useToast();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/plans');
      setPlans(res.data || []);
    } catch (error) {
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await api.get('/platform/currencies');
      setCurrencies(res.data || []);
    } catch (error) {
      console.error('Failed to load currencies:', error);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchCurrencies();
  }, []);

  const resetForm = () => {
    setName('');
    setCode('');
    setDescription('');
    setPrice('');
    setCurrency('USD');
    setBillingInterval('monthly');
    setMaxUsers(5);
    setMaxStorageGb(1);
    setMaxCompanies(1);
    setSortOrder(0);
    setEditingPlan(null);

    const modulesInit: Record<string, boolean> = {};
    AVAILABLE_MODULES.forEach(m => modulesInit[m.key] = false);
    setSelectedModules(modulesInit);

    const featuresInit: Record<string, boolean> = {};
    AVAILABLE_FEATURES.forEach(f => featuresInit[f.key] = false);
    setSelectedFeatures(featuresInit);
  };

  const handleEdit = (plan: TenantPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setCode(plan.code);
    setDescription(plan.description || '');
    setPrice(plan.price);
    setCurrency(plan.currency);
    setBillingInterval(plan.billingInterval);
    setMaxUsers(plan.maxUsers);
    setMaxStorageGb(plan.maxStorageGb);
    setMaxCompanies(plan.maxCompanies);
    setSortOrder(plan.sortOrder);

    const modulesMap: Record<string, boolean> = {};
    AVAILABLE_MODULES.forEach(m => {
      modulesMap[m.key] = plan.enabledModules?.[m.key] || false;
    });
    setSelectedModules(modulesMap);

    const featuresMap: Record<string, boolean> = {};
    AVAILABLE_FEATURES.forEach(f => {
      featuresMap[f.key] = plan.features?.[f.key] || false;
    });
    setSelectedFeatures(featuresMap);

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        code,
        description,
        price: parseFloat(price),
        currency,
        billingInterval,
        maxUsers: parseInt(maxUsers.toString()),
        maxStorageGb: parseInt(maxStorageGb.toString()),
        maxCompanies: parseInt(maxCompanies.toString()),
        sortOrder: parseInt(sortOrder.toString()),
        enabledModules: selectedModules,
        features: selectedFeatures,
      };

      if (editingPlan) {
        await api.put(`/platform/plans/${editingPlan.id}`, payload);
        toast.success('Subscription plan updated successfully');
      } else {
        await api.post('/platform/plans', payload);
        toast.success('Subscription plan created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      toast.error('Failed to save subscription plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this plan? Users will not be able to subscribe to it.')) return;
    try {
      await api.delete(`/platform/plans/${id}`);
      toast.success('Plan deactivated successfully');
      fetchPlans();
    } catch (error) {
      toast.error('Failed to deactivate plan');
    }
  };

  const toggleModule = (key: string) => {
    setSelectedModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFeature = (key: string) => {
    setSelectedFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-gray-900 uppercase">SaaS Subscription Plans</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
            Configure starter, growth, and enterprise tiers for companies
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={14} /> Create Service Plan
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="ent-card border-t-4 border-t-slate-900 bg-white relative flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase text-gray-900">{plan.name}</h3>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mt-0.5">
                      {plan.code} (Order: {plan.sortOrder})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50 transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-50 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {plan.description && (
                  <p className="text-[10px] text-slate-500 font-medium mb-4 italic">
                    {plan.description}
                  </p>
                )}

                <div className="mb-6 bg-slate-50 p-3 rounded-md border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">{plan.currency}</span>
                  <span className="text-2xl font-black text-slate-900">
                    {parseFloat(plan.price).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">/ {plan.billingInterval}</span>
                </div>

                {/* Plan Limits */}
                <div className="space-y-2 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    <span>Max Users/Employees</span>
                    <span className="text-slate-900 font-black">{plan.maxUsers}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    <span>Cloud Storage Limit</span>
                    <span className="text-slate-900 font-black">{plan.maxStorageGb} GB</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    <span>Max Entities/Companies</span>
                    <span className="text-slate-900 font-black">{plan.maxCompanies}</span>
                  </div>
                </div>

                {/* Enabled Modules */}
                <div className="mb-6">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Enabled Modules</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(plan.enabledModules || {}).map(([key, val]) => {
                      if (!val) return null;
                      const label = AVAILABLE_MODULES.find(m => m.key === key)?.label || key;
                      return (
                        <span key={key} className="text-[8px] bg-indigo-50 text-indigo-700 font-extrabold uppercase px-1.5 py-0.5 rounded border border-indigo-100">
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Enabled Features */}
                <div className="mb-6">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Premium Features</h4>
                  <div className="space-y-1.5">
                    {Object.entries(plan.features || {}).map(([key, val]) => {
                      if (!val) return null;
                      const label = AVAILABLE_FEATURES.find(f => f.key === key)?.label || key;
                      return (
                        <div key={key} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                          <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded inline-block ${plan.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {plan.isActive ? 'Active Plan' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h3 className="text-sm font-black uppercase text-gray-900">
                {editingPlan ? 'Edit Subscription Plan' : 'Create Global Subscription Plan'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-gray-900">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="ent-form-group">
                  <label className="ent-label">Plan Name</label>
                  <input type="text" className="ent-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Growth Pack" />
                </div>
                <div className="ent-form-group">
                  <label className="ent-label">Internal Code (Unique)</label>
                  <input type="text" className="ent-input" value={code} onChange={e => setCode(e.target.value)} required placeholder="e.g. growth_monthly" disabled={!!editingPlan} />
                </div>
              </div>

              <div className="ent-form-group">
                <label className="ent-label">Short Description</label>
                <input type="text" className="ent-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="For growing teams with full collaboration needs" />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="ent-form-group">
                  <label className="ent-label">Price</label>
                  <input type="number" className="ent-input" value={price} onChange={e => setPrice(e.target.value)} required placeholder="0.00" />
                </div>
                <div className="ent-form-group col-span-1">
                  <CustomSelect
                    label="Currency"
                    value={currency}
                    onChange={setCurrency}
                    options={currencies.map(c => ({ label: `${c.code} (${c.symbol})`, value: c.code }))}
                  />
                </div>
                <div className="ent-form-group">
                  <CustomSelect
                    label="Billing Interval"
                    value={billingInterval}
                    onChange={setBillingInterval}
                    options={[
                      { label: 'Monthly', value: 'monthly' },
                      { label: 'Quarterly', value: 'quarterly' },
                      { label: 'Yearly', value: 'yearly' },
                    ]}
                  />
                </div>
                <div className="ent-form-group">
                  <label className="ent-label">Sort Order</label>
                  <input type="number" className="ent-input" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value || '0'))} />
                </div>
              </div>

              {/* Usage Limits */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Usage Threshold Limits</h4>
                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-md border border-slate-100">
                  <div className="ent-form-group">
                    <label className="ent-label">Max Users (Staff/HR)</label>
                    <input type="number" className="ent-input" value={maxUsers} onChange={e => setMaxUsers(parseInt(e.target.value || '0'))} />
                  </div>
                  <div className="ent-form-group">
                    <label className="ent-label">Max Storage Capacity (GB)</label>
                    <input type="number" className="ent-input" value={maxStorageGb} onChange={e => setMaxStorageGb(parseInt(e.target.value || '0'))} />
                  </div>
                  <div className="ent-form-group">
                    <label className="ent-label">Max Child Companies</label>
                    <input type="number" className="ent-input" value={maxCompanies} onChange={e => setMaxCompanies(parseInt(e.target.value || '0'))} />
                  </div>
                </div>
              </div>

              {/* Module Inclusion Selection */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Include Modules</h4>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_MODULES.map(m => (
                    <div
                      key={m.key}
                      onClick={() => toggleModule(m.key)}
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all select-none ${selectedModules[m.key] ? 'bg-primary-50 border-primary-200 text-primary-900 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${selectedModules[m.key] ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300'}`}>
                        {selectedModules[m.key] && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Checklist */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Premium Features Flag</h4>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_FEATURES.map(f => (
                    <div
                      key={f.key}
                      onClick={() => toggleFeature(f.key)}
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all select-none ${selectedFeatures[f.key] ? 'bg-primary-50 border-primary-200 text-primary-900 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${selectedFeatures[f.key] ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300'}`}>
                        {selectedFeatures[f.key] && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex-shrink-0">
                <button type="submit" className="btn-primary w-full py-3">
                  {editingPlan ? 'Save Service Plan Configuration' : 'Create & Publish Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
