'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Mail, Send, History, RefreshCw, AlertTriangle, CheckCircle, Clock, Search, Users, Plus, ShieldCheck, Scale } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface EmailLog {
  id: string;
  recipient: string;
  sender: string;
  subject: string;
  department: string;
  status: 'pending' | 'sent' | 'failed';
  errorMessage: string | null;
  sentAt: string;
  attempts: number;
}

interface Stats {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  total: number;
}

export default function EmailCenterPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [stats, setStats] = useState<Stats>({ totalSent: 0, totalFailed: 0, totalPending: 0, total: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const toast = useToast();

  // Directory Data
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');

  // Form State
  const [department, setDepartment] = useState('info');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.get('/settings/email/logs', {
        params: {
          page,
          limit: 10,
          status: statusFilter,
          department: deptFilter,
          search: searchTerm,
        }
      });
      setLogs(res.data?.logs || []);
      setStats(res.data?.stats || { totalSent: 0, totalFailed: 0, totalPending: 0, total: 0 });
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load email outbox logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadDirectory = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments')
      ]);
      setEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (error) {
      console.error('Failed to load directory:', error);
    }
  };

  useEffect(() => {
    loadDirectory();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchLogs();
    }
  }, [activeTab, page, statusFilter, deptFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body || body.trim() === '' || body === '<p><br></p>') {
      toast.error('Email body is required');
      return;
    }
    try {
      setSending(true);
      await api.post('/emails/send', {
        to,
        cc: cc ? cc : undefined,
        bcc: bcc ? bcc : undefined,
        subject,
        body,
        department,
        isHtml: true,
      });

      toast.success('Email dispatched and queued successfully');
      // Reset form
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setActiveTab('history');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to dispatch email');
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async (logId: string) => {
    try {
      await api.post(`/settings/email/logs/${logId}/retry`);
      toast.success('Email queued for retry');
      fetchLogs();
    } catch {
      toast.error('Failed to retry email dispatch');
    }
  };

  // Recipient Helpers
  const toggleEmailInField = (email: string, field: 'to' | 'cc' | 'bcc') => {
    const currentVal = field === 'to' ? to : (field === 'cc' ? cc : bcc);
    const setVal = field === 'to' ? setTo : (field === 'cc' ? setCc : setBcc);

    let emails = currentVal.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    if (emails.includes(email)) {
      emails = emails.filter(e => e !== email);
    } else {
      emails.push(email);
    }
    setVal(emails.join(', '));
  };

  const addDepartmentEmails = (deptId: string, field: 'to' | 'cc' | 'bcc') => {
    const currentVal = field === 'to' ? to : (field === 'cc' ? cc : bcc);
    const setVal = field === 'to' ? setTo : (field === 'cc' ? setCc : setBcc);

    let emails = currentVal.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    
    const deptEmails = employees
      .filter(emp => emp.departmentId === deptId && emp.email)
      .map(emp => emp.email);

    if (deptEmails.length === 0) {
      toast.error('No employees found in this department');
      return;
    }

    const merged = Array.from(new Set([...emails, ...deptEmails]));
    setVal(merged.join(', '));
    toast.success(`Added ${deptEmails.length} department emails to ${field.toUpperCase()}`);
  };

  const addAllEmployees = (field: 'to' | 'cc' | 'bcc') => {
    const currentVal = field === 'to' ? to : (field === 'cc' ? cc : bcc);
    const setVal = field === 'to' ? setTo : (field === 'cc' ? setCc : setBcc);

    let emails = currentVal.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    const allEmails = employees.map(emp => emp.email).filter(Boolean);

    if (allEmails.length === 0) {
      toast.error('No employee emails found');
      return;
    }

    const merged = Array.from(new Set([...emails, ...allEmails]));
    setVal(merged.join(', '));
    toast.success(`Added all ${allEmails.length} employees to ${field.toUpperCase()}`);
  };

  const clearField = (field: 'to' | 'cc' | 'bcc') => {
    const setVal = field === 'to' ? setTo : (field === 'cc' ? setCc : setBcc);
    setVal('');
  };

  const isEmailInField = (email: string, field: 'to' | 'cc' | 'bcc') => {
    const currentVal = field === 'to' ? to : (field === 'cc' ? cc : bcc);
    const emails = currentVal.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    return emails.includes(email);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      (emp.firstName || '').toLowerCase().includes(searchEmployee.toLowerCase()) ||
      (emp.lastName || '').toLowerCase().includes(searchEmployee.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchEmployee.toLowerCase());
    const matchesDept = !selectedDeptId || emp.departmentId === selectedDeptId;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="animate-fade-in pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8 px-2">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Email Dispatch Center
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase font-black tracking-widest">
                Transactional
              </span>
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Compose, route, and audit outbound emails from integrated corporate mailboxes.
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Outbox Overview */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('compose')}
            className={`py-3 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'compose'
                ? 'border-primary-900 text-primary-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Send size={14} /> Compose Message
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-primary-900 text-primary-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <History size={14} /> Outbox Logs & Stats
          </button>
        </div>

        {activeTab === 'compose' ? (
          /* COMPOSE EMAIL FORM */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 ent-card p-6">
              <form onSubmit={handleSend} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="ent-form-group col-span-2">
                    <label className="ent-label">From Department (Sender Mailbox)</label>
                    <CustomSelect
                      options={[
                        { label: 'Accounts & Billing (accounts@)', value: 'accounts' },
                        { label: 'Human Resources (hr@)', value: 'hr' },
                        { label: 'Support Services (support@)', value: 'support' },
                        { label: 'Sales & Marketing (sales@)', value: 'sales' },
                        { label: 'General Info (info@)', value: 'info' },
                        { label: 'Connect Outreach (connect@)', value: 'connect' }
                      ]}
                      value={department}
                      onChange={setDepartment}
                    />
                  </div>

                  <div className="ent-form-group col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="ent-label !mb-0">To (Recipients - separated with commas) *</label>
                      <button
                        type="button"
                        onClick={() => clearField('to')}
                        className="text-[8px] font-black uppercase text-slate-400 hover:text-slate-600 tracking-wider"
                      >
                        Clear field
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. client@example.com, user@example.com"
                      className="ent-input"
                      value={to}
                      onChange={e => setTo(e.target.value)}
                    />
                  </div>

                  <div className="ent-form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="ent-label !mb-0">Cc (Carbon Copy)</label>
                      <button
                        type="button"
                        onClick={() => clearField('cc')}
                        className="text-[8px] font-black uppercase text-slate-400 hover:text-slate-600 tracking-wider"
                      >
                        Clear
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="cc@example.com, another@example.com"
                      className="ent-input"
                      value={cc}
                      onChange={e => setCc(e.target.value)}
                    />
                  </div>
                  <div className="ent-form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="ent-label !mb-0">Bcc (Blind Carbon Copy)</label>
                      <button
                        type="button"
                        onClick={() => clearField('bcc')}
                        className="text-[8px] font-black uppercase text-slate-400 hover:text-slate-600 tracking-wider"
                      >
                        Clear
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="bcc@example.com, hidden@example.com"
                      className="ent-input"
                      value={bcc}
                      onChange={e => setBcc(e.target.value)}
                    />
                  </div>

                  <div className="ent-form-group col-span-2">
                    <label className="ent-label">Subject Line *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter subject"
                      className="ent-input"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="ent-form-group col-span-2">
                    <label className="ent-label">Email Body (HTML supported)</label>
                    <RichTextEditor
                      value={body}
                      onChange={setBody}
                      placeholder="Write your email here..."
                      className="min-h-[250px]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-primary py-3 px-6 flex items-center gap-2"
                  >
                    {sending ? (
                      <>
                        <LoadingSpinner /> Dispatching...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* COMPOSE SIDEBAR NOTES & DIRECTORY */}
            <div className="space-y-6">
              {/* Recipient Directory panel */}
              <div className="ent-card p-5 bg-slate-50/50 flex flex-col max-h-[600px]">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Users size={14} className="text-slate-500" />
                  Recipient Directory
                </h4>
                
                {/* Send to all buttons */}
                <div className="space-y-2 mb-4 bg-white border border-slate-200/60 p-3 rounded-lg">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Global Quick Add</span>
                  <div className="flex gap-1.5 justify-between">
                    <button
                      type="button"
                      onClick={() => addAllEmployees('to')}
                      className="flex-1 py-1 px-2 bg-primary-50 text-primary-700 text-[8px] font-black uppercase rounded border border-primary-100 hover:bg-primary-100 transition-colors text-center"
                    >
                      + To All
                    </button>
                    <button
                      type="button"
                      onClick={() => addAllEmployees('cc')}
                      className="flex-1 py-1 px-2 bg-slate-100 text-slate-700 text-[8px] font-black uppercase rounded border border-slate-200 hover:bg-slate-200 transition-colors text-center"
                    >
                      + Cc All
                    </button>
                    <button
                      type="button"
                      onClick={() => addAllEmployees('bcc')}
                      className="flex-1 py-1 px-2 bg-slate-100 text-slate-700 text-[8px] font-black uppercase rounded border border-slate-200 hover:bg-slate-200 transition-colors text-center"
                    >
                      + Bcc All
                    </button>
                  </div>
                </div>

                {/* Department quick add */}
                <div className="space-y-2 mb-4 bg-white border border-slate-200/60 p-3 rounded-lg">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Department Quick Add</span>
                  <CustomSelect
                    options={[
                      { label: 'All Departments', value: '' },
                      ...departments.map(d => ({ label: d.name, value: d.id }))
                    ]}
                    value={selectedDeptId}
                    onChange={setSelectedDeptId}
                    placeholder="Select Department"
                    className="w-full text-[10px]"
                  />
                  {selectedDeptId && (
                    <div className="flex gap-1.5 justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => addDepartmentEmails(selectedDeptId, 'to')}
                        className="flex-1 py-1 px-2 bg-primary-50 text-primary-700 text-[8px] font-black uppercase rounded border border-primary-100 hover:bg-primary-100 transition-colors text-center"
                      >
                        + To Dept
                      </button>
                      <button
                        type="button"
                        onClick={() => addDepartmentEmails(selectedDeptId, 'cc')}
                        className="flex-1 py-1 px-2 bg-slate-100 text-slate-700 text-[8px] font-black uppercase rounded border border-slate-200 hover:bg-slate-200 transition-colors text-center"
                      >
                        + Cc Dept
                      </button>
                      <button
                        type="button"
                        onClick={() => addDepartmentEmails(selectedDeptId, 'bcc')}
                        className="flex-1 py-1 px-2 bg-slate-100 text-slate-700 text-[8px] font-black uppercase rounded border border-slate-200 hover:bg-slate-200 transition-colors text-center"
                      >
                        + Bcc Dept
                      </button>
                    </div>
                  )}
                </div>

                {/* Employee Directory List */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Individual Employees</span>
                  <div className="relative mb-2">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search employee..."
                      className="ent-input pl-8 py-1.5 text-[10px] w-full"
                      value={searchEmployee}
                      onChange={e => setSearchEmployee(e.target.value)}
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200/60 rounded-lg max-h-[250px] scrollbar-thin">
                    {filteredEmployees.length === 0 ? (
                      <div className="py-8 text-center text-[10px] font-bold text-slate-400 uppercase italic">
                        No employees found
                      </div>
                    ) : (
                      filteredEmployees.map(emp => {
                        const inTo = isEmailInField(emp.email, 'to');
                        const inCc = isEmailInField(emp.email, 'cc');
                        const inBcc = isEmailInField(emp.email, 'bcc');

                        return (
                          <div key={emp.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="min-w-0 pr-2">
                              <div className="text-[10px] font-black text-slate-800 truncate">
                                {emp.firstName} {emp.lastName}
                              </div>
                              <div className="text-[9px] text-slate-400 font-bold truncate lowercase">{emp.email}</div>
                              {emp.department && (
                                <span className="inline-block text-[7px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-1 py-0.5 rounded mt-0.5">
                                  {emp.department.name}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleEmailInField(emp.email, 'to')}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border transition-all ${
                                  inTo 
                                    ? 'bg-primary-900 border-primary-950 text-white shadow-sm' 
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                To
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleEmailInField(emp.email, 'cc')}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border transition-all ${
                                  inCc 
                                    ? 'bg-blue-600 border-blue-700 text-white shadow-sm' 
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                Cc
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleEmailInField(emp.email, 'bcc')}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border transition-all ${
                                  inBcc 
                                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm' 
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                Bcc
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* OUTBOX LOGS & STATS */
          <div className="space-y-6">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Dispatched</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h3>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg text-slate-600"><Mail size={20} /></div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sent Successfully</p>
                  <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.totalSent}</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle size={20} /></div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Failed Delivery</p>
                  <h3 className="text-2xl font-black text-rose-600 mt-1">{stats.totalFailed}</h3>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg text-rose-600"><AlertTriangle size={20} /></div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Pending / Outbox</p>
                  <h3 className="text-2xl font-black text-amber-500 mt-1">{stats.totalPending}</h3>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-amber-500"><Clock size={20} /></div>
              </div>
            </div>

            {/* Filter controls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <form onSubmit={handleSearch} className="relative w-full md:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by recipient or subject..."
                  className="ent-input pl-9 w-full"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </form>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <CustomSelect
                  options={[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Sent', value: 'sent' },
                    { label: 'Failed', value: 'failed' },
                    { label: 'Pending', value: 'pending' }
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className="w-full md:w-36"
                />
                <CustomSelect
                  options={[
                    { label: 'All Departments', value: 'all' },
                    { label: 'Accounts', value: 'accounts' },
                    { label: 'HR', value: 'hr' },
                    { label: 'Support', value: 'support' },
                    { label: 'Sales', value: 'sales' },
                    { label: 'Info', value: 'info' },
                    { label: 'Connect', value: 'connect' }
                  ]}
                  value={deptFilter}
                  onChange={setDeptFilter}
                  className="w-full md:w-36"
                />
              </div>
            </div>

            {/* Outbox Table */}
            <div className="ent-card overflow-hidden">
              <div className="ent-table-container">
                {loadingLogs ? (
                  <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                ) : logs.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-wider">
                    No email logs found.
                  </div>
                ) : (
                  <table className="ent-table w-full text-left">
                    <thead>
                      <tr className="bg-slate-50">
                        <th>Recipient</th>
                        <th>Subject</th>
                        <th>Department</th>
                        <th>Dispatched</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="text-xs font-black text-slate-900 tracking-tight">{log.recipient}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Sender: {log.sender}</div>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-bold text-slate-700 max-w-[250px] truncate">
                            {log.subject}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                              {log.department}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-[10px] text-slate-500 font-medium">
                            {new Date(log.sentAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {log.status === 'sent' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <CheckCircle size={10} /> Sent
                              </span>
                            ) : log.status === 'failed' ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-100 cursor-pointer"
                                title={log.errorMessage || 'Unknown delivery failure'}
                              >
                                <AlertTriangle size={10} /> Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
                                <Clock size={10} /> Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            {log.status === 'failed' && (
                              <button
                                onClick={() => handleRetry(log.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-950 text-white rounded text-[9px] font-black uppercase tracking-widest hover:bg-primary-900 transition-colors shadow-sm"
                              >
                                <RefreshCw size={10} /> Retry Send
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="px-5 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1.5 border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-white disabled:opacity-50 transition-colors"
                    >
                      Prev
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1.5 border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-white disabled:opacity-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
