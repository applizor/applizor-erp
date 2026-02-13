'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';
import { LifeBuoy, Plus, Search, Filter, MessageSquare, User, AlertCircle, CheckCircle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import Link from 'next/link';

export default function HelpdeskPage() {
    const toast = useToast();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState('open');
    const [stats, setStats] = useState({ open: 0, resolved: 0, total: 0 });

    const [newTicket, setNewTicket] = useState({ subject: '', category: 'IT', priority: 'medium', description: '' });

    useEffect(() => {
        loadTickets();
    }, [filterStatus]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tickets', { params: { status: filterStatus } });
            setTickets(res.data);

            // Calculate stats (Mock or basic calc)
            // Ideally backend returns stats
            const open = res.data.filter((t: any) => t.status === 'open').length;
            const resolved = res.data.filter((t: any) => t.status === 'resolved').length;
            setStats({ open, resolved, total: res.data.length });

        } catch (error) {
            console.error(error);
            toast.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/tickets', newTicket);
            toast.success('Ticket created successfully');
            setIsCreateOpen(false);
            setNewTicket({ subject: '', category: 'IT', priority: 'medium', description: '' });
            loadTickets();
        } catch (error) {
            toast.error('Failed to create ticket');
        }
    };

    const priorityColors: Record<string, string> = {
        low: 'bg-slate-100 text-slate-700',
        medium: 'bg-blue-100 text-blue-700',
        high: 'bg-orange-100 text-orange-700',
        urgent: 'bg-rose-100 text-rose-700'
    };

    const statusColors: Record<string, string> = {
        open: 'ent-badge-primary',
        'in-progress': 'ent-badge-warning',
        resolved: 'ent-badge-success',
        closed: 'ent-badge-neutral'
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <LifeBuoy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Support Command Center</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest">
                            Issue Tracking & Resolution
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-40">
                        <div className="relative">
                            <select
                                className="ent-input w-full appearance-none pr-8 cursor-pointer"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="open">Open Issues</option>
                                <option value="resolved">Resolved</option>
                                <option value="all">All Tickets</option>
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2 bg-primary-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-primary-900/10 flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={14} /> New Ticket
                    </button>
                </div>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 gap-4">
                    {tickets.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">No tickets found.</div>
                    ) : (
                        tickets.map((ticket) => (
                            <Link key={ticket.id} href={`/helpdesk/${ticket.id}`} className="block">
                                <div className="ent-card group hover:border-primary-200 transition-all cursor-pointer">
                                    <div className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${priorityColors[ticket.priority] || 'bg-gray-100'}`}>
                                                    {ticket.priority} Priority
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                    #{ticket.id.substring(0, 6).toUpperCase()} • {ticket.category}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-primary-600 transition-colors">
                                                {ticket.subject}
                                            </h3>
                                            <p className="text-xs text-gray-500 line-clamp-1">
                                                {ticket.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-6 shrink-0 md:pl-6 w-full md:w-auto justify-between md:justify-end">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs border border-white shadow-sm">
                                                    {ticket.creator?.firstName?.[0] || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-900 uppercase">{ticket.creator?.firstName}</span>
                                                    <span className="text-[9px] text-gray-400 font-mono">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <span className={`ent-badge ${statusColors[ticket.status]}`}>
                                                {ticket.status?.toUpperCase()}
                                            </span>

                                            {ticket._count?.messages > 0 && (
                                                <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold">
                                                    <MessageSquare size={12} />
                                                    {ticket._count.messages}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}

            <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Submit Support Ticket">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Subject</Label>
                        <Input
                            required
                            value={newTicket.subject}
                            onChange={(e: any) => setNewTicket({ ...newTicket, subject: e.target.value })}
                            placeholder="Brief summary of the issue"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Category</Label>
                            <select
                                className="ent-input w-full"
                                value={newTicket.category}
                                onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
                            >
                                <option value="IT">IT Hardware/Software</option>
                                <option value="HR">HR / Payroll</option>
                                <option value="Finance">Finance / Expense</option>
                                <option value="Admin">Office Admin</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Priority</Label>
                            <select
                                className="ent-input w-full"
                                value={newTicket.priority}
                                onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Textarea
                            required
                            value={newTicket.description}
                            onChange={(e: any) => setNewTicket({ ...newTicket, description: e.target.value })}
                            placeholder="Detailed explanation..."
                            rows={4}
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button type="submit">Submit Ticket</Button>
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
