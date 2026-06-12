'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
    Bot, 
    Plus, 
    Shield, 
    Activity, 
    Cpu, 
    Briefcase,
    CheckCircle2,
    XCircle,
    Power,
    Loader2,
    AlertCircle
} from 'lucide-react';

interface AiAgent {
    id: string;
    name: string;
    role: string;
    department: string;
    status: string;
    model: string;
    permissions: any;
    description: string;
    createdAt: string;
}

export default function AgentRegistryPage() {
    const [agents, setAgents] = useState<AiAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Modal & Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        department: '',
        model: 'gemini-2.5-flash',
        description: '',
        permissions: [] as string[]
    });

    const availableModules = [
        'Employee', 'Department', 'Position', 'Asset', 'Attendance', 
        'Leave', 'Payroll', 'Project', 'Document', 'Ticket', 'Lead', 'Client', 'Invoice'
    ];

    const fetchAgents = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get('/ai/agents');
            setAgents(res.data);
        } catch (err: any) {
            console.error('Failed to load agents:', err);
            setError(err.response?.data?.error || 'Failed to fetch AI agents list');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
        try {
            await api.put(`/ai/agents/${id}/status`, { status: nextStatus });
            setAgents(prev => prev.map(a => a.id === id ? { ...a, status: nextStatus } : a));
        } catch (err) {
            console.error('Failed to update agent status:', err);
            alert('Failed to change agent status');
        }
    };

    const handlePermissionCheckbox = (moduleName: string) => {
        setFormData(prev => {
            const hasPerm = prev.permissions.includes(moduleName);
            const updated = hasPerm 
                ? prev.permissions.filter(p => p !== moduleName) 
                : [...prev.permissions, moduleName];
            return { ...prev, permissions: updated };
        });
    };

    const handleCreateAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.role || !formData.department) {
            alert('Please fill out all required fields');
            return;
        }

        try {
            setFormSubmitting(true);
            const payload = {
                ...formData,
                permissions: { modules: formData.permissions }
            };
            const res = await api.post('/ai/agents', payload);
            setAgents(prev => [res.data, ...prev]);
            setIsModalOpen(false);
            setFormData({
                name: '',
                role: '',
                department: '',
                model: 'gemini-2.5-flash',
                description: '',
                permissions: []
            });
        } catch (err: any) {
            console.error('Failed to create agent:', err);
            alert(err.response?.data?.error || 'Failed to deploy agent');
        } finally {
            setFormSubmitting(false);
        }
    };

    // Calculate dynamic stats
    const totalCount = agents.length;
    const activeCount = agents.filter(a => a.status === 'active').length;
    const modelDistribution = agents.reduce((acc, a) => {
        acc[a.model] = (acc[a.model] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Bot className="w-7 h-7 text-primary-600 animate-pulse" />
                        AI workforce Registry
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Deploy, manage, and monitor autonomous Gemini agent nodes across enterprise departments.
                    </p>
                </div>
                
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-medium rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Deploy AI Agent
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Agents</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-600">
                        <Bot className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Nodes</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                        <Activity className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model</p>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">
                            {modelDistribution['gemini-2.5-flash'] || 0} <span className="text-xs font-medium text-slate-400">Flash</span>
                        </p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                        <Cpu className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Latency</p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">1.2s</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                        <Cpu className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Grid of Agents */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                    <p className="text-sm text-slate-500 mt-4 font-medium">Scanning AI registers...</p>
                </div>
            ) : error ? (
                <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-red-800">Connection Error</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                        <button onClick={fetchAgents} className="mt-3 text-xs font-bold text-red-800 underline hover:text-red-900">
                            Retry Connection
                        </button>
                    </div>
                </div>
            ) : agents.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Bot className="w-16 h-16 text-slate-300 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-800 mt-4">No AI Agents Deployed</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                        Your enterprise AI workforce is empty. Deploy your first autonomous agent node to automate key operations.
                    </p>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors"
                    >
                        Deploy Agent
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map((agent) => {
                        const modules = agent.permissions?.modules || [];
                        return (
                            <div key={agent.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden relative group">
                                {/* Top colored edge bar */}
                                <div className={`h-1.5 w-full ${agent.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-300'}`} />

                                <div className="p-6 space-y-4 flex-1">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${agent.status === 'active' ? 'bg-primary-50 border-primary-100 text-primary-600 shadow-inner group-hover:scale-105' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                <Bot className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 group-hover:text-primary-700 transition-colors">{agent.name}</h3>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-slate-400">
                                                    <Briefcase className="w-3.5 h-3.5" />
                                                    <span>{agent.role}</span>
                                                    <span>•</span>
                                                    <span>{agent.department}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Status badge */}
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            agent.status === 'active' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                                            {agent.status}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-slate-500 leading-relaxed min-h-[40px]">
                                        {agent.description || 'No system description provided for this autonomous agent node.'}
                                    </p>

                                    {/* System Specifications */}
                                    <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-[10px] text-slate-500 space-y-1.5">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-slate-400">LLM Engine</span>
                                            <span className="font-bold text-slate-700">{agent.model}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-slate-400">Node ID</span>
                                            <span className="font-mono text-slate-600 select-all">{agent.id.slice(0, 8)}...</span>
                                        </div>
                                    </div>

                                    {/* Permissions */}
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <Shield className="w-3.5 h-3.5" />
                                            Authorized ERP Scopes
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {modules.length === 0 ? (
                                                <span className="text-[10px] text-slate-400 italic">No modules authorized</span>
                                            ) : (
                                                modules.map((mod: string) => (
                                                    <span key={mod} className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                        {mod}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="bg-slate-50/50 border-t border-slate-100 p-4 flex justify-between items-center">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        Deployed {new Date(agent.createdAt).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={() => handleToggleStatus(agent.id, agent.status)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                            agent.status === 'active'
                                                ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600'
                                                : 'bg-primary-50 border-primary-100 text-primary-700 hover:bg-primary-100'
                                        }`}
                                    >
                                        <Power className="w-3.5 h-3.5" />
                                        {agent.status === 'active' ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Deploy Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsModalOpen(false)}
                    />
                    
                    {/* Modal Body */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden relative z-10 transform scale-100 transition-all">
                        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-4 text-white">
                            <h3 className="font-bold text-lg">Deploy Autonomous Agent Node</h3>
                            <p className="text-xs text-primary-100 mt-1">Configure systemic role and authorization credentials.</p>
                        </div>

                        <form onSubmit={handleCreateAgent} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Agent Name *</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. Finance Bot v1"
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">System Role *</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. Auditor"
                                        value={formData.role}
                                        onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                        className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Department *</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. Finance"
                                        value={formData.department}
                                        onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                        className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">LLM Core Model</label>
                                    <select 
                                        value={formData.model}
                                        onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                                        className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                                    >
                                        <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Free)</option>
                                        <option value="gemini-1.5-flash">gemini-1.5-flash (Fallback)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Operational Description</label>
                                <textarea 
                                    rows={2}
                                    placeholder="Write a clear functional instruction set describing what this agent handles..."
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                />
                            </div>

                            {/* Permissions checklist */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Authorized ERP Modules</label>
                                <div className="grid grid-cols-3 gap-2 max-h-[120px] overflow-y-auto p-2 bg-slate-50 border border-slate-100 rounded-lg">
                                    {availableModules.map((moduleName) => {
                                        const isChecked = formData.permissions.includes(moduleName);
                                        return (
                                            <label key={moduleName} className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handlePermissionCheckbox(moduleName)}
                                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500/20"
                                                />
                                                {moduleName}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Modal Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg text-sm hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formSubmitting}
                                    className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-semibold rounded-lg text-sm shadow-md transition-colors disabled:opacity-50"
                                >
                                    {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Deploy Node
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
