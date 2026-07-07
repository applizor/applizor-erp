'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Plus, Edit2, Trash2, X, Globe, ShieldCheck } from 'lucide-react';
import SlabBracketEditor from '@/components/ui/SlabBracketEditor';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface StatutoryRule {
  id: string;
  countryId: string;
  code: string;
  name: string;
  category: string;
  ruleType: string;
  employeeRate: string | null;
  employerRate: string | null;
  wageCeiling: string | null;
  slabData: any | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  country?: {
    name: string;
    code: string;
  };
}

export default function RulesPage() {
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
          globalOnly: true,
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
  }, [selectedCountryCode]);

  const resetForm = () => {
    setCountryId('');
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

      if (editingRule) {
        await api.put(`/platform/rules/${editingRule.id}`, payload);
        toast.success('Statutory rule updated successfully');
      } else {
        await api.post('/platform/rules', payload);
        toast.success('Statutory rule created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchRules();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save statutory rule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this statutory rule? It will no longer apply in payroll computations.')) return;
    try {
      await api.delete(`/platform/rules/${id}`);
      toast.success('Statutory rule deactivated successfully');
      fetchRules();
    } catch (error) {
      toast.error('Failed to deactivate statutory rule');
    }
  };

  const getSlabPlaceholder = () => {
    if (code === 'pt') {
      return `{\n  "Maharashtra": [\n    { "min": 0, "max": 10000, "amount": 0 },\n    { "min": 10001, "max": Infinity, "amount": 200 }\n  ]\n}`;
    }
    return `[\n  { "min": 0, "max": 11600, "rate": 10 },\n  { "min": 11601, "max": 47150, "rate": 12 }\n]`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-gray-900 uppercase">Global Statutory Rules</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
            Manage tax configurations, retirement funds, and compliance rules per country
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            // Default select the current active country in filter
            const matchedCountry = countries.find(c => c.code === selectedCountryCode);
            if (matchedCountry) setCountryId(matchedCountry.id);
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={14} /> Add Compliance Rule
        </button>
      </div>

      {/* Country Filter bar */}
      <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe size={16} className="text-slate-400" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Selected Country</span>
        </div>
        <div className="w-56">
          <CustomSelect
            label=""
            value={selectedCountryCode}
            onChange={setSelectedCountryCode}
            options={countries.map(c => ({ label: `${c.name} (${c.code})`, value: c.code }))}
          />
        </div>
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map((rule) => (
            <div key={rule.id} className="ent-card bg-white flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-900">{rule.name}</h3>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        Code: {rule.code}
                      </span>
                      <span className="text-[8px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded uppercase">
                        {rule.category}
                      </span>
                      <span className="text-[8px] bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded uppercase border border-indigo-100">
                        {rule.ruleType}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-4 border-t border-slate-50 pt-3">
                  {rule.ruleType === 'percentage' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest block">Employee Contribution</span>
                        <span className="text-sm font-black text-slate-800">{rule.employeeRate}%</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest block">Employer Contribution</span>
                        <span className="text-sm font-black text-slate-800">{rule.employerRate}%</span>
                      </div>
                    </div>
                  )}

                  {rule.wageCeiling && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wide py-1 border-b border-slate-50">
                      <span>Maximum Wage Ceiling Cap</span>
                      <span className="text-slate-800 font-black">{rule.wageCeiling}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wide py-1 border-b border-slate-50">
                    <span>Effective Period</span>
                    <span className="text-slate-800 font-black">
                      {new Date(rule.effectiveFrom).toLocaleDateString()} {rule.effectiveTo ? `to ${new Date(rule.effectiveTo).toLocaleDateString()}` : 'onwards'}
                    </span>
                  </div>

                  {rule.slabData && (
                    <div className="mt-3">
                      <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest block mb-1">Slab Bracket Configurations</span>
                      <pre className="text-[9px] bg-slate-900 text-emerald-400 p-2.5 rounded font-mono overflow-x-auto max-h-[120px] shadow-inner">
                        {JSON.stringify(rule.slabData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <div className="col-span-2 text-center py-12 bg-white rounded-md border border-slate-200">
              <ShieldCheck size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                No compliance rules set for this country
              </p>
            </div>
          )}
        </div>
      )}

      {/* Rules Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h3 className="text-sm font-black uppercase text-gray-900">
                {editingRule ? 'Edit Statutory Compliance Rule' : 'New Country Compliance Rule'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-gray-900">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="ent-form-group">
                  <CustomSelect
                    label="Associated Country"
                    value={countryId}
                    onChange={setCountryId}
                    options={countries.map(c => ({ label: c.name, value: c.id }))}
                    disabled={!!editingRule}
                  />
                </div>
                <div className="ent-form-group">
                  <label className="ent-label">Rule System Code (e.g. pf, nic, paye)</label>
                  <input
                    type="text"
                    className="ent-input"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    required
                    placeholder="e.g. pf"
                    disabled={!!editingRule}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="ent-form-group">
                  <label className="ent-label">Rule Display Name</label>
                  <input
                    type="text"
                    className="ent-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="e.g. Provident Fund"
                  />
                </div>
                <div className="ent-form-group">
                  <CustomSelect
                    label="Category"
                    value={category}
                    onChange={setCategory}
                    options={[
                      { label: 'Retirement Fund', value: 'retirement' },
                      { label: 'Health Insurance', value: 'health' },
                      { label: 'Government Tax / Deductions', value: 'tax' },
                      { label: 'Social Welfare Program', value: 'social' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="ent-form-group col-span-1">
                  <CustomSelect
                    label="Rule Calculation Type"
                    value={ruleType}
                    onChange={setRuleType}
                    options={[
                      { label: 'Percentage Contribution', value: 'percentage' },
                      { label: 'Progressive Bracket Slab', value: 'slab' },
                      { label: 'Fixed Flat Rate', value: 'fixed' },
                    ]}
                  />
                </div>
                <div className="ent-form-group">
                  <label className="ent-label">Employee Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="ent-input"
                    value={employeeRate}
                    onChange={e => setEmployeeRate(e.target.value)}
                    disabled={ruleType !== 'percentage'}
                    placeholder="0.00"
                  />
                </div>
                <div className="ent-form-group">
                  <label className="ent-label">Employer Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="ent-input"
                    value={employerRate}
                    onChange={e => setEmployerRate(e.target.value)}
                    disabled={ruleType !== 'percentage'}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="ent-form-group">
                  <label className="ent-label">Max Wage Ceiling (Cap)</label>
                  <input
                    type="number"
                    className="ent-input"
                    value={wageCeiling}
                    onChange={e => setWageCeiling(e.target.value)}
                    placeholder="e.g. 15000"
                  />
                </div>
                <div className="ent-form-group">
                  <label className="ent-label">Effective From Date</label>
                  <input
                    type="date"
                    className="ent-input"
                    value={effectiveFrom}
                    onChange={e => setEffectiveFrom(e.target.value)}
                    required
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
                        // Reset slabs with the new field type
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
                  {editingRule ? 'Save Statutory Rules Configuration' : 'Create & Apply Compliance Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
