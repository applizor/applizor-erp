'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Mail, Send, Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Plus, Trash2,
  MailCheck, MailX, Clock, ChevronLeft, ChevronRight, Search, Eye, EyeOff,
  Building2, Shield, Zap, Server, Globe
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type Provider = 'smtp' | 'microsoft' | 'google' | 'ses' | 'sendgrid' | 'mailgun';

interface ProviderConfig {
  provider: Provider;
  defaultFrom: string;
  fromName: string;
  // SMTP
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
  // Microsoft
  microsoftTenantId: string;
  microsoftClientId: string;
  microsoftClientSecret: string;
  microsoftRefreshToken: string;
  // Google
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  // SES
  sesSmtpHost: string;
  sesSmtpPort: string;
  sesSmtpUser: string;
  sesSmtpPass: string;
  sesRegion: string;
  // SendGrid
  sendgridApiKey: string;
  // Mailgun
  mailgunApiKey: string;
  mailgunDomain: string;
  mailgunHost: string;
}

interface DepartmentConfig extends ProviderConfig {
  enabled: boolean;
}

interface EmailLog {
  id: string;
  recipient: string;
  sender: string;
  subject: string;
  department: string;
  status: string;
  errorMessage: string | null;
  sentAt: string;
  attempts: number;
  lastAttempt: string | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PROVIDERS: { value: Provider; label: string; icon: any; color: string }[] = [
  { value: 'smtp', label: 'SMTP', icon: Server, color: 'bg-slate-600' },
  { value: 'microsoft', label: 'Microsoft Graph', icon: Globe, color: 'bg-blue-600' },
  { value: 'google', label: 'Google Workspace', icon: Mail, color: 'bg-red-500' },
  { value: 'ses', label: 'Amazon SES', icon: Zap, color: 'bg-amber-600' },
  { value: 'sendgrid', label: 'SendGrid', icon: Send, color: 'bg-blue-500' },
  { value: 'mailgun', label: 'Mailgun', icon: Mail, color: 'bg-rose-600' },
];

const DEPARTMENTS = [
  { key: 'accounts', label: 'Accounts Department', icon: '💼', desc: 'General finance, GST, tax compliance, and bookkeeping' },
  { key: 'billing', label: 'Billing Desk', icon: '🧾', desc: 'Invoice dispatch, client billing inquiries, and automated payment reminders' },
  { key: 'connect', label: 'Business Connect', icon: '🤝', desc: 'Business enquiries, partnerships' },
  { key: 'dl', label: 'DL - Direct Link', icon: '🔗', desc: 'Internal operations, project updates, AI agent reports' },
  { key: 'info', label: 'Information Desk', icon: '📢', desc: 'General company enquiries' },
  { key: 'careers', label: 'Careers Team', icon: '🎓', desc: 'Job applications & internships' },
  { key: 'hr', label: 'Human Resources', icon: '👤', desc: 'Recruitment, onboarding, HR' },
  { key: 'sales', label: 'Sales Team', icon: '🎯', desc: 'Sales, quotations, follow-ups' },
  { key: 'support', label: 'Customer Support', icon: '🎫', desc: 'Technical support & maintenance' },
  { key: 'marketing', label: 'Marketing Team', icon: '📈', desc: 'Social media, branding, campaigns' },
  { key: 'projects', label: 'Project Management Office', icon: '📁', desc: 'Client projects & delivery' },
  { key: 'legal', label: 'Legal Department', icon: '⚖️', desc: 'Contracts & compliance' },
];

const EMPTY_CONFIG: ProviderConfig = {
  provider: 'smtp',
  defaultFrom: '', fromName: '',
  smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: '', smtpSecure: false,
  microsoftTenantId: '', microsoftClientId: '', microsoftClientSecret: '', microsoftRefreshToken: '',
  googleClientId: '', googleClientSecret: '', googleRefreshToken: '',
  sesSmtpHost: '', sesSmtpPort: '587', sesSmtpUser: '', sesSmtpPass: '', sesRegion: '',
  sendgridApiKey: '',
  mailgunApiKey: '', mailgunDomain: '', mailgunHost: '',
};

type TabKey = 'config' | 'logs';

// ── Component ────────────────────────────────────────────────────────────────

export default function EmailSettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('config');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null); // which dept or 'default'
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; dept: string } | null>(null);

  // Config state
  const [defaultConfig, setDefaultConfig] = useState<ProviderConfig>({ ...EMPTY_CONFIG });
  const [departments, setDepartments] = useState<Record<string, DepartmentConfig>>({});
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Logs state
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [logsFilter, setLogsFilter] = useState({ status: 'all', department: 'all', search: '' });
  const [logsStats, setLogsStats] = useState({ totalSent: 0, totalFailed: 0, totalPending: 0, total: 0 });

  // ── Load config ──
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/email');
      const data = res.data;
      if (data?.default) {
        setDefaultConfig({ ...EMPTY_CONFIG, ...data.default });
      }
      if (data?.departments) {
        const depts: Record<string, DepartmentConfig> = {};
        for (const [key, val] of Object.entries(data.departments)) {
          depts[key] = { ...EMPTY_CONFIG, enabled: true, ...(val as any) };
        }
        setDepartments(depts);
      }
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  // ── Save config ──
  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: any = { default: defaultConfig, departments: {} };
      for (const [key, val] of Object.entries(departments)) {
        if (val.enabled) {
          const { enabled, ...rest } = val;
          payload.departments[key] = rest;
        }
      }
      await api.post('/settings/email', payload);
      toast.success('Email configuration saved');
      loadConfig();
    } catch { toast.error('Failed to save email config'); }
    finally { setSaving(false); }
  };

  // ── Test email ──
  const handleTest = async (dept: string) => {
    try {
      setTesting(dept);
      setTestResult(null);
      const config = dept === 'default' ? defaultConfig : departments[dept];
      const to = config?.defaultFrom || defaultConfig.defaultFrom || defaultConfig.smtpUser;
      if (!to) { toast.error('No sender email configured to send test'); setTesting(null); return; }
      const res = await api.post('/settings/email/test', { to, department: dept === 'default' ? undefined : dept });
      setTestResult({ success: true, message: res.data.message || 'Test email sent!', dept });
      toast.success('Test email sent!');
    } catch (err: any) {
      setTestResult({ success: false, message: err?.response?.data?.details || err?.response?.data?.error || 'Failed', dept });
      toast.error('Test email failed');
    }
    finally { setTesting(null); }
  };

  // ── Load logs ──
  const loadLogs = useCallback(async (page = 1) => {
    try {
      setLogsLoading(true);
      const params: any = { page, limit: logsPagination.limit };
      if (logsFilter.status !== 'all') params.status = logsFilter.status;
      if (logsFilter.department !== 'all') params.department = logsFilter.department;
      if (logsFilter.search) params.search = logsFilter.search;
      const res = await api.get('/settings/email/logs', { params });
      setLogs(res.data.logs);
      setLogsPagination(res.data.pagination);
      setLogsStats(res.data.stats);
    } catch { toast.error('Failed to load email logs'); }
    finally { setLogsLoading(false); }
  }, [logsFilter, logsPagination.limit]);

  useEffect(() => {
    if (activeTab === 'logs') loadLogs();
  }, [activeTab, logsFilter]);

  // ── Retry email ──
  const handleRetry = async (logId: string) => {
    try {
      await api.post(`/settings/email/logs/${logId}/retry`);
      toast.success('Email queued for retry');
      loadLogs(logsPagination.page);
    } catch { toast.error('Failed to retry email'); }
  };

  // ── Toggle department ──
  const toggleDept = (key: string) => {
    setDepartments(prev => {
      const existing = prev[key];
      if (existing) {
        return { ...prev, [key]: { ...existing, enabled: !existing.enabled } };
      }
      return { ...prev, [key]: { ...EMPTY_CONFIG, enabled: true } };
    });
  };

  // ── Update department field ──
  const updateDeptField = (dept: string, field: string, value: any) => {
    setDepartments(prev => ({
      ...prev,
      [dept]: { ...(prev[dept] || { ...EMPTY_CONFIG, enabled: true }), [field]: value }
    }));
  };

  // ── Render provider fields ──
  const renderProviderFields = (
    config: ProviderConfig,
    onChange: (field: string, value: any) => void,
    prefix: string
  ) => {
    const p = config.provider;
    const toggleSecret = (key: string) => setShowSecrets(s => ({ ...s, [key]: !s[key] }));
    const isDept = prefix.startsWith('dept-');

    return (
      <div className="space-y-4 mt-4">
        {/* Common: from email & name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">From Email</label>
            <input type="email" className="input-field" placeholder={isDept ? (defaultConfig.defaultFrom || "noreply@yourcompany.com") : "noreply@yourcompany.com"}
              value={config.defaultFrom} onChange={e => onChange('defaultFrom', e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">From Name</label>
            <input type="text" className="input-field" placeholder={isDept ? (defaultConfig.fromName || "Applizor ERP") : "Applizor ERP"}
              value={config.fromName} onChange={e => onChange('fromName', e.target.value)} />
          </div>
        </div>

        {/* SMTP fields */}
        {p === 'smtp' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">SMTP Host</label>
                <input className="input-field" placeholder={isDept ? (defaultConfig.smtpHost || "smtp.gmail.com") : "smtp.gmail.com"}
                  value={config.smtpHost} onChange={e => onChange('smtpHost', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">SMTP Port</label>
                <input className="input-field" placeholder={isDept ? (defaultConfig.smtpPort || "587") : "587"}
                  value={config.smtpPort} onChange={e => onChange('smtpPort', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">SMTP Username</label>
                <input className="input-field" placeholder={isDept ? (defaultConfig.smtpUser || "user@gmail.com") : "user@gmail.com"}
                  value={config.smtpUser} onChange={e => onChange('smtpUser', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">SMTP Password</label>
                <div className="relative">
                  <input type={showSecrets[`${prefix}-smtpPass`] ? 'text' : 'password'} className="input-field pr-10"
                    placeholder={isDept ? (defaultConfig.smtpPass ? "•••••••• (Inherited)" : "App password") : "App password"}
                    value={config.smtpPass} onChange={e => onChange('smtpPass', e.target.value)} />
                  <button type="button" onClick={() => toggleSecret(`${prefix}-smtpPass`)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showSecrets[`${prefix}-smtpPass`] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Microsoft Graph fields */}
        {p === 'microsoft' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Tenant ID</label>
                <input className="input-field" placeholder={isDept ? (defaultConfig.microsoftTenantId || "your-tenant-id or common") : "your-tenant-id or common"}
                  value={config.microsoftTenantId} onChange={e => onChange('microsoftTenantId', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Client ID</label>
                <input className="input-field" placeholder={isDept ? (defaultConfig.microsoftClientId || "Application (client) ID") : "Application (client) ID"}
                  value={config.microsoftClientId} onChange={e => onChange('microsoftClientId', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Client Secret</label>
                <div className="relative">
                  <input type={showSecrets[`${prefix}-msSecret`] ? 'text' : 'password'} className="input-field pr-10"
                    placeholder={isDept ? (defaultConfig.microsoftClientSecret ? "•••••••• (Inherited)" : "Client Secret Value") : "Client Secret Value"}
                    value={config.microsoftClientSecret} onChange={e => onChange('microsoftClientSecret', e.target.value)} />
                  <button type="button" onClick={() => toggleSecret(`${prefix}-msSecret`)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showSecrets[`${prefix}-msSecret`] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Refresh Token</label>
                <div className="relative">
                  <input type={showSecrets[`${prefix}-msRefresh`] ? 'text' : 'password'} className="input-field pr-10"
                    placeholder={isDept ? (defaultConfig.microsoftRefreshToken ? "•••••••• (Inherited)" : "OAuth2 Refresh Token") : "OAuth2 Refresh Token"}
                    value={config.microsoftRefreshToken} onChange={e => onChange('microsoftRefreshToken', e.target.value)} />
                  <button type="button" onClick={() => toggleSecret(`${prefix}-msRefresh`)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showSecrets[`${prefix}-msRefresh`] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Google Workspace fields */}
        {p === 'google' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Client ID</label>
                <input className="input-field" placeholder={isDept ? (defaultConfig.googleClientId || "Google Client ID") : "Google Client ID"}
                  value={config.googleClientId} onChange={e => onChange('googleClientId', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Client Secret</label>
                <div className="relative">
                  <input type={showSecrets[`${prefix}-gSecret`] ? 'text' : 'password'} className="input-field pr-10"
                    placeholder={isDept ? (defaultConfig.googleClientSecret ? "•••••••• (Inherited)" : "Google Client Secret") : "Google Client Secret"}
                    value={config.googleClientSecret} onChange={e => onChange('googleClientSecret', e.target.value)} />
                  <button type="button" onClick={() => toggleSecret(`${prefix}-gSecret`)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showSecrets[`${prefix}-gSecret`] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Refresh Token</label>
              <div className="relative">
                <input type={showSecrets[`${prefix}-gRefresh`] ? 'text' : 'password'} className="input-field pr-10"
                  placeholder={isDept ? (defaultConfig.googleRefreshToken ? "•••••••• (Inherited)" : "Google Refresh Token") : "Google Refresh Token"}
                  value={config.googleRefreshToken} onChange={e => onChange('googleRefreshToken', e.target.value)} />
                <button type="button" onClick={() => toggleSecret(`${prefix}-gRefresh`)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showSecrets[`${prefix}-gRefresh`] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Amazon SES fields */}
        {p === 'ses' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">SES Region</label>
                <input className="input-field" placeholder={isDept ? (defaultConfig.sesRegion || "us-east-1") : "us-east-1"}
                  value={config.sesRegion} onChange={e => onChange('sesRegion', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">SMTP Host</label>
                <input className="input-field" placeholder={isDept ? (defaultConfig.sesSmtpHost || "email-smtp.us-east-1.amazonaws.com") : "email-smtp.us-east-1.amazonaws.com"}
                  value={config.sesSmtpHost} onChange={e => onChange('sesSmtpHost', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">SMTP Port</label>
                <input className="input-field" placeholder={isDept ? (defaultConfig.sesSmtpPort || "587") : "587"}
                  value={config.sesSmtpPort} onChange={e => onChange('sesSmtpPort', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">SMTP Username</label>
                <input className="input-field" placeholder={isDept ? (defaultConfig.sesSmtpUser || "SES SMTP Username") : "SES SMTP Username"}
                  value={config.sesSmtpUser} onChange={e => onChange('sesSmtpUser', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">SMTP Password</label>
                <div className="relative">
                  <input type={showSecrets[`${prefix}-sesPass`] ? 'text' : 'password'} className="input-field pr-10"
                    placeholder={isDept ? (defaultConfig.sesSmtpPass ? "•••••••• (Inherited)" : "SES SMTP Password") : "SES SMTP Password"}
                    value={config.sesSmtpPass} onChange={e => onChange('sesSmtpPass', e.target.value)} />
                  <button type="button" onClick={() => toggleSecret(`${prefix}-sesPass`)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showSecrets[`${prefix}-sesPass`] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SendGrid fields */}
        {p === 'sendgrid' && (
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">SendGrid API Key</label>
            <div className="relative">
              <input type={showSecrets[`${prefix}-sgKey`] ? 'text' : 'password'} className="input-field pr-10"
                placeholder={isDept ? (defaultConfig.sendgridApiKey ? "•••••••• (Inherited)" : "SG.xxxxxxx") : "SG.xxxxxxx"}
                value={config.sendgridApiKey} onChange={e => onChange('sendgridApiKey', e.target.value)} />
              <button type="button" onClick={() => toggleSecret(`${prefix}-sgKey`)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showSecrets[`${prefix}-sgKey`] ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* Mailgun fields */}
        {p === 'mailgun' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">API Key</label>
                <div className="relative">
                  <input type={showSecrets[`${prefix}-mgKey`] ? 'text' : 'password'} className="input-field pr-10"
                    placeholder={isDept ? (defaultConfig.mailgunApiKey ? "•••••••• (Inherited)" : "key-xxxxxxx") : "key-xxxxxxx"}
                    value={config.mailgunApiKey} onChange={e => onChange('mailgunApiKey', e.target.value)} />
                  <button type="button" onClick={() => toggleSecret(`${prefix}-mgKey`)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showSecrets[`${prefix}-mgKey`] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Domain</label>
                <input className="input-field" placeholder={isDept ? (defaultConfig.mailgunDomain || "mg.yourcompany.com") : "mg.yourcompany.com"}
                  value={config.mailgunDomain} onChange={e => onChange('mailgunDomain', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">API Host (Optional)</label>
              <input className="input-field" placeholder={isDept ? (defaultConfig.mailgunHost || "api.mailgun.net (default)") : "api.mailgun.net (default) or api.eu.mailgun.net"}
                value={config.mailgunHost} onChange={e => onChange('mailgunHost', e.target.value)} />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]"><LoadingSpinner /></div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-900 rounded-md shadow-lg"><Mail className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-lg font-black text-gray-900 uppercase font-sans">Email Configuration</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
              Multi-department routing, multi-provider support & audit logs
            </p>
          </div>
        </div>
        {activeTab === 'config' && (
          <button onClick={handleSave} disabled={saving}
            className="btn-primary py-2.5 px-6 text-xs font-black uppercase tracking-widest flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save All
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-md p-1 w-fit">
        <button onClick={() => setActiveTab('config')}
          className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all ${activeTab === 'config' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
          Configuration
        </button>
        <button onClick={() => setActiveTab('logs')}
          className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all flex items-center gap-1.5 ${activeTab === 'logs' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
          Audit Logs
          {logsStats.total > 0 && <span className="text-[8px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">{logsStats.total}</span>}
        </button>
      </div>

      {/* ─── CONFIG TAB ─── */}
      {activeTab === 'config' && (
        <div className="space-y-6">

          {/* Default Global Config */}
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Default Global Email Provider</CardTitle>
                  <CardDescription>Fallback email config used when no department-specific override is set</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleTest('default')} disabled={testing !== null}
                    className="btn-secondary px-3 py-1.5 text-[10px] flex items-center gap-1.5">
                    {testing === 'default' ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Test
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Provider Select */}
              <div className="space-y-1 mb-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Email Provider</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {PROVIDERS.map(p => (
                    <button key={p.value} type="button"
                      onClick={() => setDefaultConfig(c => ({ ...c, provider: p.value }))}
                      className={`px-3 py-2.5 rounded-md text-[10px] font-black uppercase tracking-wide border transition-all flex items-center gap-1.5 justify-center ${defaultConfig.provider === p.value
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-400'
                        }`}>
                      <p.icon size={12} /> {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {renderProviderFields(defaultConfig, (f, v) => setDefaultConfig(c => ({ ...c, [f]: v })), 'default')}

              {/* Test result for default */}
              {testResult && testResult.dept === 'default' && (
                <div className={`mt-4 p-3 rounded-md text-xs flex items-center gap-2 font-bold ${testResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {testResult.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {testResult.message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Overrides */}
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle>Department Email Routing</CardTitle>
              <CardDescription>Override the default config per department. Disabled departments inherit the global default.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEPARTMENTS.map(dept => {
                const deptConfig = departments[dept.key];
                const isEnabled = deptConfig?.enabled || false;
                const isExpanded = expandedDept === dept.key;
                return (
                  <div key={dept.key} className={`border rounded-lg transition-all ${isEnabled ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'}`}>
                    {/* Department Header */}
                    <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => isEnabled && setExpandedDept(isExpanded ? null : dept.key)}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{dept.icon}</span>
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase tracking-wide">{dept.label}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{dept.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isEnabled && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">
                            {deptConfig?.provider || 'SMTP'}
                          </span>
                        )}
                        {/* Toggle */}
                        <button onClick={(e) => { e.stopPropagation(); toggleDept(dept.key); }}
                          className={`relative w-10 h-5 rounded-full transition-all ${isEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isEnabled ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>

                     {/* Expanded config */}
                    {isEnabled && isExpanded && deptConfig && (
                      <div className="px-4 pb-4 border-t border-slate-200/80">
                        {/* Tip Banner */}
                        <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-md text-[10px] text-blue-700 font-bold uppercase tracking-wider flex items-center gap-2">
                          <span className="text-sm">💡</span>
                          <span>Credentials (Tenant ID, Client ID, secrets, tokens, passwords) will inherit the global default config if left blank.</span>
                        </div>

                        {/* Provider selector for dept */}
                        <div className="space-y-1 mt-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Provider for {dept.label}</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                            {PROVIDERS.map(p => (
                              <button key={p.value} type="button"
                                onClick={() => updateDeptField(dept.key, 'provider', p.value)}
                                className={`px-2.5 py-2 rounded-md text-[9px] font-black uppercase tracking-wide border transition-all flex items-center gap-1 justify-center ${deptConfig.provider === p.value
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-200 text-slate-600 hover:border-blue-300'
                                  }`}>
                                <p.icon size={10} /> {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {renderProviderFields(deptConfig, (f, v) => updateDeptField(dept.key, f, v), `dept-${dept.key}`)}

                        {/* Department test */}
                        <div className="mt-4 flex items-center gap-3">
                          <button onClick={() => handleTest(dept.key)} disabled={testing !== null}
                            className="btn-secondary px-3 py-1.5 text-[10px] flex items-center gap-1.5">
                            {testing === dept.key ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            Test {dept.label}
                          </button>
                          {testResult && testResult.dept === dept.key && (
                            <span className={`text-[10px] font-bold flex items-center gap-1 ${testResult.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {testResult.success ? <CheckCircle size={12} /> : <XCircle size={12} />} {testResult.message}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Info panel */}
          <Card className="bg-white border border-slate-200">
            <CardHeader><CardTitle>Email Routing Logic</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-[11px] leading-relaxed text-slate-600 font-medium">
              <div className="flex gap-2">
                <Shield size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-wide mb-0.5">Automatic Department Detection</h4>
                  <p>Invoice emails automatically route to <strong>Accounts</strong>, payslips to <strong>HR</strong>, ticket replies to <strong>Support</strong>, and quotations to <strong>Sales</strong>.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Building2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-wide mb-0.5">Inherit or Override</h4>
                  <p>If a department has no custom config, it inherits the <strong>Default Global</strong> provider settings. Enable a department toggle to set unique credentials.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Zap size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-wide mb-0.5">Asynchronous Queue</h4>
                  <p>All emails go through a background queue with automatic retry (up to 5 attempts). Failed emails can be retried from the Audit Logs tab.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── LOGS TAB ─── */}
      {activeTab === 'logs' && (
        <div className="space-y-4">

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-md p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Emails</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{logsStats.total}</p>
            </div>
            <div className="bg-white border border-emerald-200 rounded-md p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1"><MailCheck size={12} /> Sent</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{logsStats.totalSent}</p>
            </div>
            <div className="bg-white border border-rose-200 rounded-md p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1"><MailX size={12} /> Failed</p>
              <p className="text-2xl font-black text-rose-700 mt-1">{logsStats.totalFailed}</p>
            </div>
            <div className="bg-white border border-amber-200 rounded-md p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1"><Clock size={12} /> Pending</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{logsStats.totalPending}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 bg-white p-4 rounded-md border border-slate-200">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input-field pl-9 text-sm" placeholder="Search recipient, subject, sender…"
                value={logsFilter.search} onChange={e => setLogsFilter(f => ({ ...f, search: e.target.value }))} />
            </div>
            <select className="input-field text-xs w-auto" value={logsFilter.status}
              onChange={e => setLogsFilter(f => ({ ...f, status: e.target.value }))}>
              <option value="all">All Statuses</option>
              <option value="sent">✅ Sent</option>
              <option value="failed">❌ Failed</option>
              <option value="pending">⏳ Pending</option>
            </select>
            <select className="input-field text-xs w-auto" value={logsFilter.department}
              onChange={e => setLogsFilter(f => ({ ...f, department: e.target.value }))}>
              <option value="all">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d.key} value={d.key}>{d.icon} {d.label}</option>)}
              <option value="default">📧 Default</option>
            </select>
            <button onClick={() => loadLogs(logsPagination.page)} className="btn-secondary px-3 py-2 text-[10px] flex items-center gap-1">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {/* Logs Table */}
          <Card className="bg-white border border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="flex justify-center items-center py-16"><LoadingSpinner /></div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Mail size={40} className="mb-3 opacity-30" />
                  <p className="text-xs font-black uppercase tracking-widest">No email logs found</p>
                  <p className="text-[10px] font-medium mt-1">Emails will appear here as they are sent</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {['Recipient', 'Subject', 'Department', 'Status', 'Sent At', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[180px]">{log.recipient}</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">{log.sender}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-slate-700 truncate max-w-[250px]">{log.subject}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              {log.department}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${log.status === 'sent' ? 'text-emerald-700 bg-emerald-50'
                              : log.status === 'failed' ? 'text-rose-700 bg-rose-50'
                                : 'text-amber-700 bg-amber-50'
                              }`}>
                              {log.status}
                            </span>
                            {log.errorMessage && (
                              <p className="text-[10px] text-rose-500 font-medium mt-1 truncate max-w-[150px]" title={log.errorMessage}>
                                {log.errorMessage}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-[10px] font-medium text-slate-500">{new Date(log.sentAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                            {log.attempts > 1 && <p className="text-[9px] text-slate-400">{log.attempts} attempts</p>}
                          </td>
                          <td className="px-4 py-3">
                            {(log.status === 'failed' || log.status === 'pending') && (
                              <button onClick={() => handleRetry(log.id)}
                                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                <RefreshCw size={11} /> Retry
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {logsPagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-md p-3">
              <p className="text-[10px] font-bold text-slate-500">
                Page {logsPagination.page} of {logsPagination.totalPages} ({logsPagination.total} total)
              </p>
              <div className="flex gap-1">
                <button disabled={logsPagination.page <= 1} onClick={() => loadLogs(logsPagination.page - 1)}
                  className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-30">
                  <ChevronLeft size={14} />
                </button>
                <button disabled={logsPagination.page >= logsPagination.totalPages} onClick={() => loadLogs(logsPagination.page + 1)}
                  className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-30">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
