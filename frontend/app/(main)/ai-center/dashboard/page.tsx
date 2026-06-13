'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import {
    Terminal,
    Send,
    Sparkles,
    HelpCircle,
    Database,
    ShieldCheck,
    Cpu,
    Clock,
    Loader2,
    RefreshCw,
    CheckCircle,
    Bot
} from 'lucide-react';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function CommandConsolePage() {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [systemStats, setSystemStats] = useState({
        projects: 0,
        tasks: 0,
        approvals: 0,
        agents: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);

    const chatEndRef = useRef<HTMLDivElement>(null);

    const quickPrompts = [
        { label: 'Workload Summary', text: 'Give me a workload summary of employees' },
        { label: 'Overdue Tasks', text: 'Show all delayed or overdue tasks' },
        { label: 'Pending Approvals', text: 'Show all pending approvals' },
        { label: 'Project Overview', text: 'Summarize all live projects' }
    ];

    const loadSystemStats = async () => {
        try {
            setStatsLoading(true);
            const res = await api.get('/ai-system/stats');
            const stats = res.data?.stats;

            setSystemStats({
                agents: stats?.totalAgents || 0,
                approvals: stats?.pendingApprovals || 0,
                projects: stats?.recentTasks?.length || 0,
                tasks: stats?.highWorkloadCount || 0
            });
        } catch (err) {
            console.error('Failed to load system stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        loadSystemStats();
        setMessages([
            {
                role: 'assistant',
                content: '### Welcome back, Arun Kumar.\n\nI am your Chief of Staff AI node. I have live access to the local ERP PostgreSQL database.\n\n**What I can do for you:**\n- Retrieve employee workload summaries & departmental assignments.\n- Pull detailed overdue/delayed tasks and project tracking sheets.\n- List action items from the Approval Queue that need your authorization.\n\nUse the quick commands on the right, or type your query below. All queries are resolved using verified live database facts.',
                timestamp: new Date()
            }
        ]);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSendMessage = async (textToSend: string) => {
        if (!textToSend.trim() || loading) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        try {
            // Check if it's a special launched request
            if (textToSend.toLowerCase().startsWith('process:')) {
                const cleanMessage = textToSend.replace(/^process:\s*/i, '');
                const res = await api.post('/ai-system/process-request', { 
                    message: cleanMessage, 
                    context: 'General Project' 
                });
                
                const flow = res.data.flow;
                const assistantMsg: ChatMessage = {
                    role: 'assistant',
                    content: `✅ **Flow Processed Successfully!**\n\n**Analysis:** ${flow.analysis.summary}\n**Task Created:** ${flow.task.id} - ${flow.task.title}\n**Assigned to:** ${flow.assignee.name}\n**Reason:** ${flow.assignee.reason}`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMsg]);
            } else {
                const res = await api.post('/ai/chat', { query: textToSend });
                const assistantMsg: ChatMessage = {
                    role: 'assistant',
                    content: res.data.response,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMsg]);
            }

            loadSystemStats();
        } catch (err: any) {
            console.error('Execution failed:', err);
            const errMsg: ChatMessage = {
                role: 'assistant',
                content: '⚠️ **Execution Error**: ' + (err.response?.data?.error || 'Unable to complete request.'),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = (text: string) => {
        return text.split('\\n').map((line, idx) => {
            if (line.startsWith('|')) {
                const cells = line.split('|').filter(c => c.trim() !== '');
                if (line.includes('---')) return null;
                return (
                    <div key={idx} className="grid grid-cols-4 gap-2 border-b border-slate-100 py-1.5 text-xs text-slate-700">
                        {cells.map((cell, cidx) => (
                            <span key={cidx} className="font-medium truncate" title={cell.trim()}>
                                {cell.trim()}
                            </span>
                        ))}
                    </div>
                );
            }
            if (line.startsWith('###')) {
                return <h4 key={idx} className="text-sm font-bold text-slate-900 mt-4 mb-2">{line.replace('###', '').trim()}</h4>;
            }
            if (line.startsWith('##')) {
                return <h3 key={idx} className="text-base font-extrabold text-slate-900 mt-5 mb-2">{line.replace('##', '').trim()}</h3>;
            }
            if (line.startsWith('#')) {
                return <h2 key={idx} className="text-lg font-black text-slate-900 mt-6 mb-3">{line.replace('#', '').trim()}</h2>;
            }
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                return (
                    <li key={idx} className="list-disc ml-5 text-sm text-slate-600 py-0.5">
                        {parseInlineMarkdown(line.substring(2))}
                    </li>
                );
            }
            return (
                <p key={idx} className="text-sm text-slate-600 leading-relaxed min-h-[12px] py-0.5">
                    {parseInlineMarkdown(line)}
                </p>
            );
        }).filter(el => el !== null);
    };

    const parseInlineMarkdown = (text: string) => {
        const boldRegex = /\\*\\*(.*?)\\*\\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            parts.push(<strong key={match.index} className="font-bold text-slate-800">{match[1]}</strong>);
            lastIndex = boldRegex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : text;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
            <div className="lg:col-span-3 flex flex-col bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
                <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="font-mono text-xs text-slate-400 font-bold ml-2 flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5" />
                            COS-CONTROL-NODE // SECURE_SHELL_V2
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                            <Database className="w-3 h-3" />
                            Live Postgres
                        </span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/20 scrollbar-thin scrollbar-thumb-slate-800">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role !== 'user' && (
                                <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-indigo-400" />
                                </div>
                            )}
                            <div className={`max-w-[85%] rounded-xl px-5 py-4 shadow-sm border ${
                                msg.role === 'user'
                                    ? 'bg-primary-600 border-primary-500 text-white rounded-br-none'
                                    : 'bg-white border-slate-100 text-slate-800 rounded-bl-none'
                            }`}>
                                {msg.role === 'user' ? (
                                    <p className="text-sm font-semibold whitespace-pre-wrap">{msg.content}</p>
                                ) : (
                                    <div className="space-y-1">
                                        {renderContent(msg.content)}
                                    </div>
                                )}
                                <span className={`text-[9px] block mt-2 ${
                                    msg.role === 'user' ? 'text-primary-200' : 'text-slate-400'
                                }`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-4 justify-start">
                            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center flex-shrink-0 animate-pulse">
                                <Bot className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="bg-white border border-slate-100 rounded-xl rounded-bl-none px-5 py-4 shadow-sm flex items-center gap-3">
                                <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                                <span className="text-xs font-semibold text-slate-500">Querying database schema and reasoning...</span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                <div className="bg-slate-950 p-4 border-t border-slate-800/80">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage(query);
                        }}
                        className="flex gap-3"
                    >
                        <input
                            type="text"
                            placeholder="Instruct Chief of Staff... (e.g. 'show workload summary' or 'tell me about our live projects')"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            disabled={loading}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-slate-700"
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-xl transition-all duration-150 flex items-center justify-center disabled:opacity-50 disabled:hover:bg-primary-600"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
            <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-primary-600" />
                            System Specifications
                        </h3>
                        <button
                            onClick={loadSystemStats}
                            className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-400">Enterprise Projects</span>
                            {statsLoading ? (
                                <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                            ) : (
                                <span className="font-bold text-slate-700">{systemStats.projects}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-400">Total System Tasks</span>
                            {statsLoading ? (
                                <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                                : <span className="font-bold text-slate-700">{systemStats.tasks}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-400">Pending Approvals</span>
                            {statsLoading ? (
                                <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                            ) : (
                                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                    systemStats.approvals > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                    {systemStats.approvals} pending
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-400">Active AI Agents</span>
                            {statsLoading ? (
                                <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                                : <span className="font-bold text-slate-700">{systemStats.agents} nodes</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                        Quick System Inquiries
                    </h3>
                    <div className="space-y-2 pt-1">
                        {quickPrompts.map((prompt, pidx) => (
                            <button
                                key={pidx}
                                onClick={() => handleSendMessage(prompt.text)}
                                disabled={loading}
                                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-primary-100 hover:bg-primary-50/20 text-xs font-semibold text-slate-600 hover:text-primary-700 transition-all duration-150 flex items-center justify-between group"
                            >
                                <span>{prompt.label}</span>
                                <Send className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary-600" />
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md space-y-3.5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Safety & Grounding
                    </h4>
                    <p className="text-[11px] text-indigo-100/80 leading-relaxed">
                        All command inquiries are strictly matched against PostgreSQL database tables with Zero-Hallucination guarding.
                    </p>
                    <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1.5 text-[10px] font-mono text-indigo-200">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>JWT Authentication Enabled</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>SSL Data Encryption Active</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Dual-Key Rate-Guarded</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
