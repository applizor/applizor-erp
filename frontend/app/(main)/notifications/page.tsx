'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';
import { Bell, CheckCheck, Mail, MailOpen, Loader2, Clock, UserPlus, FileText, DollarSign, MessageSquare } from 'lucide-react';

const iconMap: Record<string, any> = {
    user_joined: UserPlus,
    invoice_created: DollarSign,
    document_shared: FileText,
    ticket_assigned: MessageSquare,
    default: Bell,
};

export default function NotificationsPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => { loadNotifications(); }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications');
            setNotifications(Array.isArray(res.data) ? res.data : res.data?.data || []);
        } catch { toast.error('Failed to load notifications'); }
        finally { setLoading(false); }
    };

    const handleMarkAllRead = async () => {
        try {
            setMarkingAll(true);
            await api.post('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success('All marked as read');
        } catch { toast.error('Failed to mark as read'); }
        finally { setMarkingAll(false); }
    };

    const handleMarkRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}`, { read: true });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch { /* silent */ }
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-900 rounded-md shadow-lg relative">
                        <Bell className="w-6 h-6 text-white" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Notifications</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{unreadCount} unread · {notifications.length} total</p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} disabled={markingAll} className="text-xs font-black text-primary-600 uppercase tracking-widest hover:text-primary-800 flex items-center gap-2">
                        {markingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                        Mark All Read
                    </button>
                )}
            </div>

            <div className="ent-card">
                {loading ? (
                    <div className="p-12 flex flex-col items-center">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 flex flex-col items-center text-center opacity-40">
                        <Bell size={40} className="text-gray-300 mb-4" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No notifications yet</p>
                        <p className="text-xs text-gray-400 mt-2">Notifications about your activity will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((n) => {
                            const Icon = iconMap[n.type] || iconMap.default;
                            return (
                                <div key={n.id} className={`flex items-start gap-4 p-4 ${!n.read ? 'bg-primary-50/30' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}
                                    onClick={() => !n.read && handleMarkRead(n.id)}>
                                    <div className={`p-2 rounded-full ${!n.read ? 'bg-primary-100' : 'bg-gray-100'}`}>
                                        <Icon size={16} className={!n.read ? 'text-primary-600' : 'text-gray-400'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${!n.read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                            {n.title || n.message || 'Notification'}
                                        </p>
                                        {n.message && n.message !== n.title && (
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Clock size={10} className="text-gray-400" />
                                            <span className="text-[10px] text-gray-400 font-medium">{timeAgo(n.createdAt || n.timestamp)}</span>
                                            {!n.read && <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />}
                                        </div>
                                    </div>
                                    {!n.read && (
                                        <button onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                                            className="text-[9px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-800 shrink-0">
                                            <MailOpen size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
