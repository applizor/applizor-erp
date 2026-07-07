'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Plus, Edit2, Trash2, X, Globe, ShieldCheck, Scale, Info, ArrowUpRight, RotateCcw } from 'lucide-react';
import SlabBracketEditor from '@/components/ui/SlabBracketEditor';
import Portal from '@/components/ui/Portal';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface StatutoryRule {
  id: string;
  countryId: string;
  companyId: string | null;
  code: string;
  name: string;
  category: string;
  ruleType: string;
  employeeRate: number | null;
  employerRate: number | null;
  wageCeiling: number | null;
  slabData: any | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  country?: {
    name: string;
    code: string;
  };
}

export default function CompanyRulesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('IN');
  const [rules, setRules] = useState<StatutoryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<StatutoryRule | null>(null);

  // Form state
  const [countryId, setCountryId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('social');
  const [ruleType, setRuleType] = useState('percentage');
  const [employeeRate, setEmployeeRate] = useState('');
  const [employerRate, setEmployerRate] = useState('');
  const [wageCeiling, setWageCeiling] = useState('');
  const [slabData, setSlabData] = useState<any[]>([]);
  const [slabValueType, setSlabValueType] = useState<'amount' | 'rate'>('amount');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');

  const toast = useToast();

  const fetchCountries = async () => {
    try {
      const res = await api.get('/platform/countries');
      setCountries(res.data || []);
      // Auto-set countryId if country list matches selected country code
      const current = res.data?.find((c: Country) => c.code === selectedCountryCode);
      if (current) setCountryId(current.id);
    } catch (error) {
      console.error('Failed to load countries:', error);
    }
  };

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/rules', {
        params: {
          countryCode: selectedCountryCode,
        },
      });
      setRules(res.data || []);
    } catch (error) {
      toast.error('Failed to load statutory rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    fetchRules();
    const current = countries.find(c => c.code === selectedCountryCode);
    if (current) setCountryId(current.id);
  }, [selectedCountryCode, countries]);

  const resetForm = () => {
    const current = countries.find(c => c.code === selectedCountryCode);
    setCountryId(current ? current.id : '');
    setCode('');
    setName('');
    setCategory('social');
    setRuleType('percentage');
    setEmployeeRate('');
    setEmployerRate('');
    setWageCeiling('');
    setSlabData([]);
    setSlabValueType('amount');
    setEffectiveFrom('');
    setEffectiveTo('');
    setEditingRule(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setEffectiveFrom(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleEdit = (rule: StatutoryRule) => {
    setEditingRule(rule);
    setCountryId(rule.countryId);
    setCode(rule.code);
    setName(rule.name);
    setCategory(rule.category);
    setRuleType(rule.ruleType);
    setEmployeeRate(rule.employeeRate ? rule.employeeRate.toString() : '');
    setEmployerRate(rule.employerRate ? rule.employerRate.toString() : '');
    setWageCeiling(rule.wageCeiling ? rule.wageCeiling.toString() : '');
    
    const isRateSlab = rule.slabData && Array.isArray(rule.slabData) && rule.slabData.some((s: any) => s.rate !== undefined);
    setSlabValueType(isRateSlab ? 'rate' : 'amount');
    setSlabData(rule.slabData || []);
    
    setEffectiveFrom(new Date(rule.effectiveFrom).toISOString().split('T')[0]);
    setEffectiveTo(rule.effectiveTo ? new Date(rule.effectiveTo).toISOString().split('T')[0] : '');
    setIsModalOpen(true);
  };

  const handleOverride = (globalRule: StatutoryRule) => {
    resetForm();
    setCountryId(globalRule.countryId);
    setCode(globalRule.code);
    setName(`${globalRule.name} (Custom Override)`);
    setCategory(globalRule.category);
    setRuleType(globalRule.ruleType);
    setEmployeeRate(globalRule.employeeRate ? globalRule.employeeRate.toString() : '');
    setEmployerRate(globalRule.employerRate ? globalRule.employerRate.toString() : '');
    setWageCeiling(globalRule.wageCeiling ? globalRule.wageCeiling.toString() : '');
    
    const isRateSlab = globalRule.slabData && Array.isArray(globalRule.slabData) && globalRule.slabData.some((s: any) => s.rate !== undefined);
    setSlabValueType(isRateSlab ? 'rate' : 'amount');
    setSlabData(globalRule.slabData || []);
    
    setEffectiveFrom(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom compliance rule/override?')) return;
    try {
      await api.delete(`/platform/rules/company/${id}`);
      toast.success('Custom statutory rule removed successfully');
      fetchRules();
    } catch {
      toast.error('Failed to remove custom statutory rule');
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Are you sure you want to delete all custom statutory rules & overrides and restore platform defaults? This action cannot be undone.')) {
      return;
    }
    try {
      await api.post('/platform/rules/company/reset');
      toast.success('Successfully restored platform defaults');
      fetchRules();
    } catch {
      toast.error('Failed to restore platform defaults');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        countryId,
        code,
        name,
        category,
        ruleType,
        employeeRate: employeeRate ? parseFloat(employeeRate) : null,
        employerRate: employerRate ? parseFloat(employerRate) : null,
        wageCeiling: wageCeiling ? parseFloat(wageCeiling) : null,
        slabData: ruleType === 'slab' ? slabData : null,
        effectiveFrom: new Date(effectiveFrom).toISOString(),
        effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : null,
      };

      if (editingRule && editingRule.companyId) {
        await api.put(`/platform/rules/company/${editingRule.id}`, payload);
        toast.success('Custom statutory rule updated');
      } else {
        await api.post('/platform/rules/company', payload);
        toast.success('Custom statutory rule/override applied');
      }
      setIsModalOpen(false);
      resetForm();
      fetchRules();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save compliance rule');
    }
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 px-2">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-3">
              Company Statutory Rules
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 uppercase font-black tracking-widest">
                Compliance Overrides
              </span>
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Manage custom statutory rates, overrides, and salary deduction slabs specific to your payroll.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <CustomSelect
              options={countries.map(c => ({ label: `${c.name} (${c.code})`, value: c.code }))}
              value={selectedCountryCode}
              onChange={setSelectedCountryCode}
              className="w-full lg:w-48 bg-white"
            />
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm whitespace-nowrap"
            >
              <RotateCcw size={13} /> Reset to Defaults
            </button>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-primary-800 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus size={14} /> Add Custom Rule
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Rules Table */}
          <div className="ent-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Scale size={14} className="text-slate-400" />
                Active Rules list
              </h3>
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span> Company Custom / Override
                <span className="h-2 w-2 rounded-full bg-slate-300 ml-3"></span> Global Default
              </div>
            </div>

            <div className="ent-table-container">
              {loading ? (
                <div className="py-20 flex justify-center"><LoadingSpinner /></div>
              ) : rules.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-medium uppercase text-xs tracking-wider">
                  No statutory rules defined for this country.
                </div>
              ) : (
                <table className="ent-table w-full text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="rounded-l-xl">Code</th>
                      <th>Rule Name</th>
                      <th>Category</th>
                      <th>Calculation Type</th>
                      <th>Employee / Employer Rates</th>
                      <th>Wage Ceiling</th>
                      <th>Status</th>
                      <th className="text-right rounded-r-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const overriddenCodes = new Set(
                        rules.filter(r => r.companyId !== null).map(r => r.code)
                      );
                      return rules
                        .filter(rule => !(rule.companyId === null && overriddenCodes.has(rule.code)))
                        .map((rule) => {
                          const isCustom = !!rule.companyId;
                          return (
                        <tr key={rule.id} className={`group hover:bg-slate-50/50 transition-colors ${isCustom ? 'bg-blue-50/10' : ''}`}>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                              isCustom ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {rule.code}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-2">
                              {rule.name}
                              {isCustom && (
                                <span className="text-[8px] bg-blue-600 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Override
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                              Effective: {new Date(rule.effectiveFrom).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                              {rule.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">
                              {rule.ruleType === 'percentage' ? 'Percentage %' : rule.ruleType === 'slab' ? 'Slab Ranges' : 'Fixed Amount'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {rule.ruleType === 'slab' ? (
                              <span className="text-[10px] font-bold text-slate-400 italic">
                                Slabs Dynamic ({(rule.slabData || []).length} ranges)
                              </span>
                            ) : (
                              <div className="text-[10px] font-bold text-slate-900">
                                ee: <span className="text-primary-600">{rule.employeeRate !== null ? `${rule.employeeRate}%` : '—'}</span>
                                <span className="mx-2 text-slate-300">|</span>
                                er: <span className="text-emerald-600">{rule.employerRate !== null ? `${rule.employerRate}%` : '—'}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[10px] font-bold text-slate-600">
                            {rule.wageCeiling !== null ? `₹${Number(rule.wageCeiling).toLocaleString()}` : 'No Ceiling'}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                              rule.isActive 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}>
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            {isCustom ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(rule)}
                                  className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                                  title="Edit override rules"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDelete(rule.id)}
                                  className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                                  title="Remove custom rule"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOverride(rule)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-black text-primary-600 hover:text-primary-800 bg-primary-50 rounded uppercase tracking-wider hover:bg-primary-100/80 transition-all border border-primary-100/50"
                              >
                                <ArrowUpRight size={11} /> Override Rule
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  })()}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Portal>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest">
                  {editingRule ? 'Edit Custom Statutory Rule' : 'Create Custom Compliance Rule'}
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Setup tenant-specific statutory tax & deduction calculations
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="ent-form-group">
                  <label className="ent-label">Rule Code (Unique per country) *</label>
                  <input
                    type="text"
                    required
                    className="ent-input uppercase font-mono"
                    placeholder="e.g. PF, ESI, TDS"
                    value={code}
                    disabled={!!editingRule}
                    onChange={e => setCode(e.target.value)}
                  />
                </div>
                <div className="ent-form-group">
                  <label className="ent-label">Rule Name *</label>
                  <input
                    type="text"
                    required
                    className="ent-input"
                    placeholder="e.g. Employee Provident Fund"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div className="ent-form-group">
                  <label className="ent-label">Category *</label>
                  <CustomSelect
                    options={[
                      { label: 'Retirement Fund (PF, Superannuation)', value: 'retirement' },
                      { label: 'Health Insurance (ESI, Medical)', value: 'health' },
                      { label: 'Tax Deductions (TDS, Professional Tax)', value: 'tax' },
                      { label: 'Social & General Compliance', value: 'social' }
                    ]}
                    value={category}
                    onChange={setCategory}
                  />
                </div>

                <div className="ent-form-group">
                  <label className="ent-label">Calculation Type *</label>
                  <CustomSelect
                    options={[
                      { label: 'Percentage % of Wages', value: 'percentage' },
                      { label: 'Dynamic Slabs Table', value: 'slab' },
                      { label: 'Fixed Flat Amount', value: 'fixed' }
                    ]}
                    value={ruleType}
                    onChange={setRuleType}
                  />
                </div>

                {ruleType !== 'slab' && (
                  <>
                    <div className="ent-form-group">
                      <label className="ent-label">Employee Deduction Rate (%) / Flat Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="ent-input"
                        placeholder="e.g. 12"
                        value={employeeRate}
                        onChange={e => setEmployeeRate(e.target.value)}
                      />
                    </div>
                    <div className="ent-form-group">
                      <label className="ent-label">Employer Contribution Rate (%) / Flat Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="ent-input"
                        placeholder="e.g. 12"
                        value={employerRate}
                        onChange={e => setEmployerRate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="ent-form-group">
                  <label className="ent-label">Wage Ceiling (Limit on basic salary for calculation)</label>
                  <input
                    type="number"
                    className="ent-input"
                    placeholder="e.g. 15000 (Optional)"
                    value={wageCeiling}
                    onChange={e => setWageCeiling(e.target.value)}
                  />
                </div>

                <div className="ent-form-group">
                  <label className="ent-label">Effective From Date *</label>
                  <input
                    type="date"
                    required
                    className="ent-input"
                    value={effectiveFrom}
                    onChange={e => setEffectiveFrom(e.target.value)}
                  />
                </div>
                <div className="ent-form-group">
                  <label className="ent-label">Effective To Date (Optional)</label>
                  <input
                    type="date"
                    className="ent-input"
                    value={effectiveTo}
                    onChange={e => setEffectiveTo(e.target.value)}
                  />
                </div>
              </div>

              {ruleType === 'slab' && (
                <div className="space-y-4">
                  <div className="ent-form-group">
                    <label className="ent-label">Slab Value Type</label>
                    <CustomSelect
                      options={[
                        { label: 'Fixed Deduction Amount (Flat)', value: 'amount' },
                        { label: 'Deduction Percentage Rate (%)', value: 'rate' }
                      ]}
                      value={slabValueType}
                      onChange={(val) => {
                        setSlabValueType(val as 'amount' | 'rate');
                        setSlabData(prev => prev.map(s => {
                          const { amount, rate, ...rest } = s;
                          return val === 'rate' ? { ...rest, rate: 0 } : { ...rest, amount: 0 };
                        }));
                      }}
                    />
                  </div>
                  <SlabBracketEditor
                    value={slabData}
                    onChange={setSlabData}
                    ruleType={ruleType}
                    valueType={slabValueType}
                  />
                </div>
              )}

              <div className="pt-4 flex-shrink-0">
                <button type="submit" className="btn-primary w-full py-3">
                  {editingRule ? 'Save Statutory Rules Configuration' : 'Create & Apply Compliance Override'}
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
