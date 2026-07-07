'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Plus, Trash2, X, FolderMinus, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface CoaTemplate {
  id: string;
  countryId: string;
  name: string;
  version: string;
  isActive: boolean;
  country: {
    name: string;
    code: string;
  };
  entries?: CoaTemplateEntry[];
}

interface CoaTemplateEntry {
  id: string;
  templateId: string;
  code: string;
  name: string;
  type: string;
  parentCode: string | null;
  description: string | null;
}

interface Tenant {
  id: string;
  name: string;
}

export default function CoaPage() {
  const [templates, setTemplates] = useState<CoaTemplate[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CoaTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Modals state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Create Template form state
  const [countryId, setCountryId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [version, setVersion] = useState('1.0');

  // Add Entry form state
  const [entryCode, setEntryCode] = useState('');
  const [entryName, setEntryName] = useState('');
  const [entryType, setEntryType] = useState('asset');
  const [parentCode, setParentCode] = useState('');
  const [entryDescription, setEntryDescription] = useState('');

  // Apply template form state
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [applyTemplateId, setApplyTemplateId] = useState('');

  const toast = useToast();

  const fetchCountries = async () => {
    try {
      const res = await api.get('/platform/countries');
      setCountries(res.data || []);
    } catch (error) {
      console.error('Failed to load countries:', error);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await api.get('/platform/tenants', { params: { limit: 100 } });
      setTenants(res.data.tenants || []);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/coa/templates');
      setTemplates(res.data || []);
      if (res.data && res.data.length > 0 && !selectedTemplate) {
        fetchTemplateDetails(res.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load Chart of Accounts templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateDetails = async (id: string) => {
    try {
      setDetailsLoading(true);
      const res = await api.get(`/platform/coa/templates/${id}`);
      setSelectedTemplate(res.data);
    } catch (error) {
      toast.error('Failed to load template account entries');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
    fetchTenants();
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/platform/coa/templates', {
        countryId,
        name: templateName,
        version,
      });
      toast.success('COA template created successfully');
      setIsTemplateModalOpen(false);
      setTemplateName('');
      setCountryId('');
      setVersion('1.0');
      fetchTemplates();
      if (res.data) fetchTemplateDetails(res.data.id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create template');
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    try {
      await api.post(`/platform/coa/templates/${selectedTemplate.id}/entries`, {
        code: entryCode,
        name: entryName,
        type: entryType,
        parentCode: parentCode || null,
        description: entryDescription || null,
      });
      toast.success('Account entry added to template');
      setIsEntryModalOpen(false);
      setEntryCode('');
      setEntryName('');
      setEntryType('asset');
      setParentCode('');
      setEntryDescription('');
      fetchTemplateDetails(selectedTemplate.id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add entry');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!selectedTemplate) return;
    if (!confirm('Are you sure you want to delete this account entry from the template?')) return;
    try {
      await api.delete(`/platform/coa/entries/${entryId}`);
      toast.success('Account entry deleted');
      fetchTemplateDetails(selectedTemplate.id);
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const handleDeactivateTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this template?')) return;
    try {
      await api.delete(`/platform/coa/templates/${id}`);
      toast.success('COA template deactivated');
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to deactivate template');
    }
  };

  const handleApplyTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/platform/coa/apply/${targetCompanyId}`, {
        templateId: applyTemplateId,
      });
      toast.success('COA template applied to tenant ledger accounts successfully!');
      setIsApplyModalOpen(false);
      setTargetCompanyId('');
      setApplyTemplateId('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to apply template to tenant');
    }
  };

  const getSortedEntries = () => {
    if (!selectedTemplate?.entries) return [];
    return [...selectedTemplate.entries].sort((a, b) => a.code.localeCompare(b.code));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-gray-900 uppercase">COA Templates</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
            Manage global Chart of Accounts templates and initialize tenant ledgers
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (selectedTemplate) setApplyTemplateId(selectedTemplate.id);
              setIsApplyModalOpen(true);
            }}
            className="btn-outline flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <CheckCircle2 size={14} /> Apply to Company
          </button>
          <button onClick={() => setIsTemplateModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={14} /> Create Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Templates List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Templates</span>
            </div>
            {loading ? (
              <div className="p-6 flex justify-center"><LoadingSpinner /></div>
            ) : (
              <div className="divide-y divide-slate-100">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => fetchTemplateDetails(tpl.id)}
                    className={`p-3.5 cursor-pointer flex items-center justify-between transition-colors hover:bg-slate-50 ${
                      selectedTemplate?.id === tpl.id ? 'bg-primary-50/50 border-l-4 border-primary-600' : ''
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-900 leading-tight">
                        {tpl.name}
                      </h4>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">
                          V{tpl.version}
                        </span>
                        <span className="text-[8px] bg-slate-100 text-slate-500 font-black uppercase px-1 rounded">
                          {tpl.country.code}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                ))}

                {templates.length === 0 && (
                  <p className="text-[10px] text-slate-400 text-center py-6 font-bold uppercase">
                    No templates found
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Template details / accounts list */}
        <div className="lg:col-span-3">
          {selectedTemplate ? (
            <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase">
                    {selectedTemplate.name} <span className="text-xs font-bold text-slate-400 normal-case">(Version {selectedTemplate.version})</span>
                  </h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    Standard Charts of Accounts for {selectedTemplate.country.name}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDeactivateTemplate(selectedTemplate.id)}
                    className="p-2 text-[10px] font-black uppercase text-red-600 hover:bg-red-50 border border-red-200 rounded transition-all"
                  >
                    Delete Template
                  </button>
                  <button
                    onClick={() => setIsEntryModalOpen(true)}
                    className="btn-primary py-2 px-3 text-[10px] flex items-center gap-1.5"
                  >
                    <Plus size={12} /> Add Account
                  </button>
                </div>
              </div>

              {detailsLoading ? (
                <div className="flex justify-center p-12"><LoadingSpinner /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Account Code</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Account Name</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Type</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Parent Code</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Description</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedEntries().map((entry) => (
                        <tr key={entry.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 text-xs">
                          <td className="p-4 font-mono font-bold text-slate-900">{entry.code}</td>
                          <td className="p-4 font-bold text-slate-800">{entry.name}</td>
                          <td className="p-4">
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                              entry.type === 'asset' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              entry.type === 'liability' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              entry.type === 'equity' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              entry.type === 'income' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-500">{entry.parentCode || '—'}</td>
                          <td className="p-4 text-slate-500 truncate max-w-[200px]" title={entry.description || ''}>
                            {entry.description || '—'}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {(!selectedTemplate.entries || selectedTemplate.entries.length === 0) && (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400 font-black uppercase text-[10px]">
                            No accounts defined for this template
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-md border border-gray-200 p-12 text-center shadow-sm">
              <FolderMinus size={40} className="text-slate-300 mx-auto mb-4" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Select or create a Chart of Accounts template to manage details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black uppercase text-gray-900">
                New Chart of Accounts Template
              </h3>
              <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-gray-900">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div className="ent-form-group">
                <CustomSelect
                  label="Target Country"
                  value={countryId}
                  onChange={setCountryId}
                  options={[
                    { label: '-- Select Country --', value: '' },
                    ...countries.map(c => ({ label: `${c.name} (${c.code})`, value: c.id })),
                  ]}
                />
              </div>

              <div className="ent-form-group">
                <label className="ent-label">Template Title</label>
                <input
                  type="text"
                  className="ent-input"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  required
                  placeholder="e.g. India GAAP Schedule III"
                />
              </div>

              <div className="ent-form-group">
                <label className="ent-label">Template Version</label>
                <input
                  type="text"
                  className="ent-input"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  required
                  placeholder="1.0"
                />
              </div>

              <div className="pt-4">
                <button type="submit" className="btn-primary w-full py-3">
                  Create Template Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entry Modal */}
      {isEntryModalOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                <FileText size={16} className="text-slate-500" /> Add Account: {selectedTemplate.name}
              </h3>
              <button onClick={() => setIsEntryModalOpen(false)} className="text-slate-400 hover:text-gray-900">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddEntry} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="ent-form-group">
                  <label className="ent-label">Account Code</label>
                  <input
                    type="text"
                    className="ent-input"
                    value={entryCode}
                    onChange={e => setEntryCode(e.target.value)}
                    required
                    placeholder="e.g. 1200"
                  />
                </div>
                <div className="ent-form-group">
                  <CustomSelect
                    label="Account Type"
                    value={entryType}
                    onChange={setEntryType}
                    options={[
                      { label: 'Asset', value: 'asset' },
                      { label: 'Liability', value: 'liability' },
                      { label: 'Equity', value: 'equity' },
                      { label: 'Revenue / Income', value: 'income' },
                      { label: 'Operating Expense', value: 'expense' },
                    ]}
                  />
                </div>
              </div>

              <div className="ent-form-group">
                <label className="ent-label">Account Name</label>
                <input
                  type="text"
                  className="ent-input"
                  value={entryName}
                  onChange={e => setEntryName(e.target.value)}
                  required
                  placeholder="e.g. Accounts Receivable"
                />
              </div>

              <div className="ent-form-group">
                <label className="ent-label">Parent Account Code (Optional)</label>
                <input
                  type="text"
                  className="ent-input"
                  value={parentCode}
                  onChange={e => setParentCode(e.target.value)}
                  placeholder="e.g. 1000"
                />
              </div>

              <div className="ent-form-group">
                <label className="ent-label">Account description</label>
                <textarea
                  className="ent-input min-h-[60px]"
                  value={entryDescription}
                  onChange={e => setEntryDescription(e.target.value)}
                  placeholder="Used to track money owed by customers."
                />
              </div>

              <div className="pt-4">
                <button type="submit" className="btn-primary w-full py-3">
                  Publish Account to Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Template Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" /> Apply COA to Tenant
              </h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-slate-400 hover:text-gray-900">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleApplyTemplate} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded text-[10px] font-bold uppercase tracking-wide leading-relaxed">
                🚨 WARNING: Applying a Chart of Accounts template to a company will automatically construct its ledger accounts. Make sure you select the correct tenant.
              </div>

              <div className="ent-form-group">
                <CustomSelect
                  label="Select COA Template"
                  value={applyTemplateId}
                  onChange={setApplyTemplateId}
                  options={templates.map(t => ({ label: `${t.name} (V${t.version})`, value: t.id }))}
                />
              </div>

              <div className="ent-form-group">
                <CustomSelect
                  label="Select Target Tenant Company"
                  value={targetCompanyId}
                  onChange={setTargetCompanyId}
                  options={[
                    { label: '-- Select Tenant --', value: '' },
                    ...tenants.map(t => ({ label: t.name, value: t.id })),
                  ]}
                />
              </div>

              <div className="pt-4">
                <button type="submit" className="btn-primary w-full py-3" disabled={!targetCompanyId || !applyTemplateId}>
                  Initialize Company Accounts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
