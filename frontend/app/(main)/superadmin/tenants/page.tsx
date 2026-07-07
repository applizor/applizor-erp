'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Plus, Search, Edit2, Trash2, Ban, Check, X, ShieldAlert, Users, Building, Activity } from 'lucide-react';
import Portal from '@/components/ui/Portal';

interface Tenant {
  id: string;
  name: string;
  legalName: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  isActive: boolean;
  timezone: string;
  locale: string;
  currency: string;
  countryId: string | null;
  stateId: string | null;
  createdAt: string;
  _count: {
    users: number;
    employees: number;
  };
  tenantSubscription: {
    status: string;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    autoRenew?: boolean;
    notes?: string | null;
    plan: {
      id: string;
      name: string;
      code: string;
    };
  } | null;
  countryData: { name: string } | null;
  stateData: { name: string } | null;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [locales, setLocales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  // Modals state
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Onboarding form state
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [countryId, setCountryId] = useState('');
  const [stateId, setStateId] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [locale, setLocale] = useState('en-IN');
  const [currency, setCurrency] = useState('INR');
  const [planCode, setPlanCode] = useState('');

  // Subscription edit form state
  const [subPlanId, setSubPlanId] = useState('');
  const [subStatus, setSubStatus] = useState('active');
  const [subAutoRenew, setSubAutoRenew] = useState(true);
  const [subNotes, setSubNotes] = useState('');

  const toast = useToast();

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/tenants', {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilter,
          planId: planFilter,
        },
      });
      setTenants(res.data.tenants || []);
      setTotalPages(res.data.pagination.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [plansRes, countriesRes, currenciesRes, localesRes, timezonesRes] = await Promise.all([
        api.get('/platform/plans'),
        api.get('/platform/countries'),
        api.get('/platform/currencies'),
        api.get('/platform/locales'),
        api.get('/platform/timezones'),
      ]);
      setPlans(plansRes.data || []);
      setCountries(countriesRes.data || []);
      setCurrencies(currenciesRes.data || []);
      setLocales(localesRes.data || []);
      setTimezones(timezonesRes.data || []);
    } catch (error) {
      console.error('Failed to load reference data:', error);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [page, statusFilter, planFilter]);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    const fetchStates = async () => {
      if (!countryId) {
        setStates([]);
        return;
      }
      try {
        const res = await api.get(`/platform/states?countryId=${countryId}`);
        setStates(res.data || []);
      } catch (error) {
        console.error('Failed to load states:', error);
      }
    };
    fetchStates();
  }, [countryId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTenants();
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/platform/tenants', {
        name,
        legalName,
        email,
        phone,
        address,
        city,
        countryId,
        stateId: stateId || null,
        timezone,
        locale,
        currency,
        planCode: planCode || null,
      });
      toast.success('Tenant onboarded successfully!');
      setIsOnboardOpen(false);
      resetOnboardForm();
      fetchTenants();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to onboard tenant');
    }
  };

  const resetOnboardForm = () => {
    setName('');
    setLegalName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setCountryId('');
    setStateId('');
    setTimezone('Asia/Kolkata');
    setLocale('en-IN');
    setCurrency('INR');
    setPlanCode('');
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this tenant?')) return;
    try {
      await api.put(`/platform/tenants/${id}/suspend`);
      toast.success('Tenant suspended successfully');
      fetchTenants();
    } catch (error) {
      toast.error('Failed to suspend tenant');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.put(`/platform/tenants/${id}/activate`);
      toast.success('Tenant activated successfully');
      fetchTenants();
    } catch (error) {
      toast.error('Failed to activate tenant');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('WARNING: Deleting a tenant will remove all related company data permanently. Are you sure?')) return;
    try {
      await api.delete(`/platform/tenants/${id}`);
      toast.success('Tenant deleted successfully');
      fetchTenants();
    } catch (error) {
      toast.error('Failed to delete tenant');
    }
  };

  const openSubModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setSubPlanId(tenant.tenantSubscription?.plan?.id || '');
    setSubStatus(tenant.tenantSubscription?.status || 'active');
    setSubAutoRenew(tenant.tenantSubscription?.autoRenew ?? true);
    setSubNotes(tenant.tenantSubscription?.notes || '');
    setIsSubOpen(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setName(tenant.name || '');
    setLegalName(tenant.legalName || '');
    setEmail(tenant.email || '');
    setPhone(tenant.phone || '');
    setAddress(tenant.address || '');
    setCity(tenant.city || '');
    setCountryId(tenant.countryId || '');
    setStateId(tenant.stateId || '');
    setTimezone(tenant.timezone || 'Asia/Kolkata');
    setLocale(tenant.locale || 'en-IN');
    setCurrency(tenant.currency || 'INR');
    setIsEditOpen(true);
  };

  const handleEditUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    try {
      await api.put(`/platform/tenants/${selectedTenant.id}`, {
        name,
        legalName,
        email,
        phone,
        address,
        city,
        countryId,
        stateId: stateId || null,
        timezone,
        locale,
        currency,
      });
      toast.success('Tenant details updated successfully!');
      setIsEditOpen(false);
      setSelectedTenant(null);
      resetOnboardForm();
      fetchTenants();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update tenant details');
    }
  };

  const handleSubUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    try {
      await api.put(`/platform/tenants/${selectedTenant.id}/subscription`, {
        planId: subPlanId,
        status: subStatus,
        autoRenew: subAutoRenew,
        notes: subNotes,
      });
      toast.success('Tenant subscription updated successfully');
      setIsSubOpen(false);
      fetchTenants();
    } catch (error) {
      toast.error('Failed to update subscription');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-gray-900 uppercase">Tenant Management</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
            Monitor, onboard, and edit company subscription profiles
          </p>
        </div>
        <button onClick={() => setIsOnboardOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Onboard Company
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search company by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </form>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="w-40">
            <CustomSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Active Only', value: 'active' },
                { label: 'Suspended Only', value: 'suspended' },
              ]}
            />
          </div>
          <div className="w-48">
            <CustomSelect
              label="Subscription Plan"
              value={planFilter}
              onChange={setPlanFilter}
              options={[
                { label: 'All Plans', value: '' },
                ...plans.map((p) => ({ label: p.name, value: p.id })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Company</th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Contact details</th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Plan & Subscription</th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Scale Stats</th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Status</th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-xs">{tenant.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">{tenant.id}</div>
                      {tenant.countryData && (
                        <div className="text-[8px] font-black text-indigo-500 uppercase tracking-wider mt-1">
                          {tenant.countryData.name} {tenant.stateData ? `— ${tenant.stateData.name}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-600 text-xs">{tenant.email}</div>
                      {tenant.phone && <div className="text-[9px] text-slate-400 font-mono mt-0.5">{tenant.phone}</div>}
                    </td>
                    <td className="p-4">
                      {tenant.tenantSubscription ? (
                        <div>
                          <div className="font-bold text-xs text-slate-800">
                            {tenant.tenantSubscription.plan.name}
                          </div>
                          <div className="flex gap-2 items-center mt-1">
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                              tenant.tenantSubscription.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              tenant.tenantSubscription.status === 'trial' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                              'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {tenant.tenantSubscription.status}
                            </span>
                            {tenant.tenantSubscription.currentPeriodEnd && (
                              <span className="text-[8px] text-slate-400 font-semibold">
                                Ends: {new Date(tenant.tenantSubscription.currentPeriodEnd).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-black uppercase">No Active Plan</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1.5">
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded">
                          {tenant._count.users} Users
                        </span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded">
                          {tenant._count.employees} Employees
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded inline-block ${
                        tenant.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {tenant.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(tenant)}
                          title="Edit Tenant Details"
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-50"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => openSubModal(tenant)}
                          title="Edit Subscription Plan"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50"
                        >
                          <Activity size={14} />
                        </button>
                        {tenant.isActive ? (
                          <button
                            onClick={() => handleSuspend(tenant.id)}
                            title="Suspend Tenant"
                            className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-50"
                          >
                            <Ban size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(tenant.id)}
                            title="Activate Tenant"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-50"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(tenant.id)}
                          title="Delete Company Data"
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-black uppercase text-xs">
                      No tenants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 bg-slate-50 border-t border-slate-100">
              <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} variant="outline" size="sm">
                Previous Page
              </Button>
              <span className="text-xs text-slate-500 font-bold">
                Page {page} of {totalPages}
              </span>
              <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} variant="outline" size="sm">
                Next Page
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Onboard Modal */}
      <Portal>
        {isOnboardOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <h3 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                  <Building size={16} className="text-slate-500" /> Onboard New Tenant Company
                </h3>
                <button onClick={() => setIsOnboardOpen(false)} className="text-slate-400 hover:text-gray-900">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleOnboard} className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="ent-form-group">
                    <label className="ent-label">Company Name</label>
                    <input type="text" className="ent-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Acme Corporation" />
                  </div>
                  <div className="ent-form-group">
                    <label className="ent-label">Legal Name</label>
                    <input type="text" className="ent-input" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="e.g. Acme Corp Private Ltd" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="ent-form-group">
                    <label className="ent-label">Corporate Email</label>
                    <input type="email" className="ent-input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@acme.com" />
                  </div>
                  <div className="ent-form-group">
                    <label className="ent-label">Phone Contact</label>
                    <input type="text" className="ent-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9988776655" />
                  </div>
                </div>

                <div className="ent-form-group">
                  <label className="ent-label">Headquarters Address</label>
                  <textarea className="ent-input min-h-[60px]" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Suite 404, Tech Park" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="ent-form-group">
                    <CustomSelect
                      label="Country Master"
                      value={countryId}
                      onChange={setCountryId}
                      options={[
                        { label: '-- Select Country --', value: '' },
                        ...countries.map((c) => ({ label: `${c.name} (${c.code})`, value: c.id })),
                      ]}
                    />
                  </div>
                  <div className="ent-form-group">
                    <CustomSelect
                      label="State / Province"
                      value={stateId}
                      onChange={setStateId}
                      options={[
                        { label: '-- Select State --', value: '' },
                        ...states.map((s) => ({ label: s.name, value: s.id })),
                      ]}
                      disabled={!countryId}
                    />
                  </div>
                  <div className="ent-form-group">
                    <label className="ent-label">City</label>
                    <input type="text" className="ent-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="ent-form-group">
                    <CustomSelect
                      label="Locale config"
                      value={locale}
                      onChange={setLocale}
                      options={locales.map((l) => ({ label: l.label, value: l.code }))}
                    />
                  </div>
                  <div className="ent-form-group">
                    <CustomSelect
                      label="System Currency"
                      value={currency}
                      onChange={setCurrency}
                      options={currencies.map((c) => ({ label: `${c.code} (${c.symbol})`, value: c.code }))}
                    />
                  </div>
                  <div className="ent-form-group">
                    <CustomSelect
                      label="Default Timezone"
                      value={timezone}
                      onChange={setTimezone}
                      options={timezones.map((tz) => ({ label: tz, value: tz }))}
                    />
                  </div>
                </div>

                <div className="ent-form-group">
                  <CustomSelect
                    label="Initial Plan Assignment"
                    value={planCode}
                    onChange={setPlanCode}
                    options={[
                      { label: 'None (Assign Free Trial)', value: '' },
                      ...plans.map((p) => ({ label: `${p.name} ($${p.price})`, value: p.code })),
                    ]}
                  />
                </div>

                <div className="pt-4 flex-shrink-0">
                  <button type="submit" className="btn-primary w-full py-3">
                    Onboard & Launch Tenant
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Portal>

      {/* Edit Profile Modal */}
      <Portal>
        {isEditOpen && selectedTenant && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <h3 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                  <Building size={16} className="text-slate-500" /> Edit Tenant Company Profile
                </h3>
                <button onClick={() => { setIsEditOpen(false); resetOnboardForm(); }} className="text-slate-400 hover:text-gray-900">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleEditUpdate} className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="ent-form-group">
                    <label className="ent-label">Company Name</label>
                    <input type="text" className="ent-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Acme Corporation" />
                  </div>
                  <div className="ent-form-group">
                    <label className="ent-label">Legal Name</label>
                    <input type="text" className="ent-input" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="e.g. Acme Corp Private Ltd" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="ent-form-group">
                    <label className="ent-label">Corporate Email</label>
                    <input type="email" className="ent-input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@acme.com" />
                  </div>
                  <div className="ent-form-group">
                    <label className="ent-label">Phone Contact</label>
                    <input type="text" className="ent-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9988776655" />
                  </div>
                </div>

                <div className="ent-form-group">
                  <label className="ent-label">Headquarters Address</label>
                  <textarea className="ent-input min-h-[60px]" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Suite 404, Tech Park" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="ent-form-group">
                    <CustomSelect
                      label="Country Master"
                      value={countryId}
                      onChange={setCountryId}
                      options={[
                        { label: '-- Select Country --', value: '' },
                        ...countries.map((c) => ({ label: `${c.name} (${c.code})`, value: c.id })),
                      ]}
                    />
                  </div>
                  <div className="ent-form-group">
                    <CustomSelect
                      label="State / Province"
                      value={stateId}
                      onChange={setStateId}
                      options={[
                        { label: '-- Select State --', value: '' },
                        ...states.map((s) => ({ label: s.name, value: s.id })),
                      ]}
                      disabled={!countryId}
                    />
                  </div>
                  <div className="ent-form-group">
                    <label className="ent-label">City</label>
                    <input type="text" className="ent-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="ent-form-group">
                    <CustomSelect
                      label="Locale config"
                      value={locale}
                      onChange={setLocale}
                      options={locales.map((l) => ({ label: l.label, value: l.code }))}
                    />
                  </div>
                  <div className="ent-form-group">
                    <CustomSelect
                      label="System Currency"
                      value={currency}
                      onChange={setCurrency}
                      options={currencies.map((c) => ({ label: `${c.code} (${c.symbol})`, value: c.code }))}
                    />
                  </div>
                  <div className="ent-form-group">
                    <CustomSelect
                      label="Default Timezone"
                      value={timezone}
                      onChange={setTimezone}
                      options={timezones.map((tz) => ({ label: tz, value: tz }))}
                    />
                  </div>
                </div>

                <div className="pt-4 flex-shrink-0">
                  <button type="submit" className="btn-primary w-full py-3">
                    Save Profile Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Portal>

      {/* Subscription Update Modal */}
      <Portal>
        {isSubOpen && selectedTenant && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                  <Activity size={16} className="text-slate-500" /> Subscription: {selectedTenant.name}
                </h3>
                <button onClick={() => setIsSubOpen(false)} className="text-slate-400 hover:text-gray-900">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubUpdate} className="p-6 space-y-4">
                <div className="ent-form-group">
                  <CustomSelect
                    label="Assigned Service Plan"
                    value={subPlanId}
                    onChange={setSubPlanId}
                    options={[
                      { label: '-- Select Plan --', value: '' },
                      ...plans.map((p) => ({ label: `${p.name} ($${p.price}/${p.interval})`, value: p.id })),
                    ]}
                  />
                </div>

                <div className="ent-form-group">
                  <CustomSelect
                    label="Subscription Status"
                    value={subStatus}
                    onChange={setSubStatus}
                    options={[
                      { label: 'Active', value: 'active' },
                      { label: 'Trial', value: 'trial' },
                      { label: 'Paused', value: 'paused' },
                      { label: 'Cancelled', value: 'cancelled' },
                      { label: 'Expired', value: 'expired' },
                    ]}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={subAutoRenew}
                    onChange={(e) => setSubAutoRenew(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                  />
                  <label htmlFor="autoRenew" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Enable Auto-Renew Billing
                  </label>
                </div>

                <div className="ent-form-group">
                  <label className="ent-label">Subscription Admin Notes</label>
                  <textarea
                    className="ent-input min-h-[80px]"
                    value={subNotes}
                    onChange={(e) => setSubNotes(e.target.value)}
                    placeholder="e.g. Manually extended trial period by 2 weeks."
                  />
                </div>

                <div className="pt-4">
                  <button type="submit" className="btn-primary w-full py-3">
                    Save Subscription Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Portal>
    </div>
  );
}
