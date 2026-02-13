'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';
import { Send, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';

export default function TicketDetailPage() {
    const { id } = useParams();
    const toast = useToast();
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (id) loadTicket();
    }, [id]);

    const loadTicket = async () => {
        try {
            const res = await api.get(`/tickets/${id}`);
            setTicket(res.data);
        } catch (error) {
            toast.error('Failed to load ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;

        setSending(true);
        try {
            await api.post(`/tickets/${id}/reply`, { content: reply, isInternal: false });
            setReply('');
            loadTicket(); // Refresh to see new message
        } catch (error) {
            toast.error('Failed to send reply');
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            await api.put(`/tickets/${id}`, { status: newStatus });
            setTicket((prev: any) => ({ ...prev, status: newStatus }));
            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!ticket) return <div className="p-10 text-center text-gray-500">Ticket not found</div>;

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 p-6">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                #{ticket.id.substring(0, 8)}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                {ticket.status}
                            </span>
                        </div>
                        <h1 className="text-lg font-black text-gray-900 leading-tight">{ticket.subject}</h1>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        {ticket.status !== 'resolved' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange('resolved')} className="gap-2">
                                <CheckCircle2 size={14} className="text-emerald-500" />
                                Mark Resolved
                            </Button>
                        )}
                        {ticket.status === 'resolved' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange('open')} className="gap-2">
                                <AlertCircle size={14} className="text-blue-500" />
                                Re-open
                            </Button>
                        )}
                    </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Original Description */}
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
                            {ticket.creator?.firstName[0]}
                        </div>
                        <div className="space-y-1 max-w-[80%]">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xs font-bold text-gray-900">{ticket.creator?.firstName}</span>
                                <span className="text-[10px] text-gray-400">{new Date(ticket.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="p-3 bg-white border border-gray-200 rounded-md rounded-tl-none shadow-sm text-sm text-gray-700 whitespace-pre-wrap">
                                {ticket.description}
                            </div>
                        </div>
                    </div>

                    {/* Replies */}
                    {ticket.messages?.map((msg: any) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.senderId === ticket.createdById ? '' : 'flex-row-reverse'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${msg.senderId === ticket.createdById ? 'bg-primary-100 text-primary-700' : 'bg-slate-800 text-white'}`}>
                                {msg.sender?.firstName?.[0] || 'S'}
                            </div>
                            <div className={`space-y-1 max-w-[80%] flex flex-col ${msg.senderId === ticket.createdById ? 'items-start' : 'items-end'}`}>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xs font-bold text-gray-900">{msg.sender?.firstName || 'System'}</span>
                                    <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
                                </div>
                                <div className={`p-3 rounded-md shadow-sm text-sm whitespace-pre-wrap ${msg.senderId === ticket.createdById ? 'bg-white border border-gray-200 rounded-tl-none text-gray-700' : 'bg-primary-50 border border-primary-100 rounded-tr-none text-gray-800'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Reply Box */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <form onSubmit={handleReply} className="relative">
                        <Textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Type your reply here..."
                            className="w-full pr-12 min-h-[80px]"
                            disabled={sending}
                        />
                        <button
                            type="submit"
                            disabled={!reply.trim() || sending}
                            className="absolute right-3 bottom-3 p-2 bg-primary-900 text-white rounded hover:bg-black disabled:opacity-50 transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Sidebar Metadata */}
            <div className="w-80 space-y-4">
                <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-wider">Ticket Info</h3>

                    <div className="space-y-4">
                        <div>
                            <Label className="text-[10px] text-gray-400">Category</Label>
                            <p className="text-sm font-bold text-gray-900">{ticket.category}</p>
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-400">Priority</Label>
                            <p className="text-sm font-bold text-gray-900 capitalize">{ticket.priority}</p>
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-400">Assigned To</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">
                                    {ticket.assignee?.firstName?.[0] || '?'}
                                </div>
                                <p className="text-sm font-medium text-gray-700">
                                    {ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : 'Unassigned'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
