
'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import api from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { socket } = useSocket();
    const { toast } = useToast();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Listen for new notifications via socket
        if (socket) {
            socket.on('notification', (newNotification: Notification) => {
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
                // Toast is already handled in SocketContext, but we update the list here
            });
        }

        return () => {
            if (socket) {
                socket.off('notification');
            }
        };
    }, [socket]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Failed to mark all as read');
        }
    };

    const clearAll = async () => {
        try {
            await api.delete('/notifications/clear-all');
            setNotifications([]);
            setUnreadCount(0);
            toast.success('Notifications cleared');
        } catch (error) {
            console.error('Failed to clear notifications');
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-500 hover:bg-gray-50 hover:text-primary-600 rounded-md transition-all relative"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-100 origin-top-right z-50">
                    <div className="p-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 rounded-t-lg">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">Notifications</h3>
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-white transition-colors"
                                >
                                    <Check size={12} /> Mark all read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="text-gray-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                    title="Clear all"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 text-xs">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-medium">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-3 hover:bg-gray-50 transition-colors group relative ${!notification.isRead ? 'bg-primary-50/30' : ''}`}
                                    >
                                        <div onClick={() => handleNotificationClick(notification)} className="cursor-pointer">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <h4 className={`text-xs ${!notification.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                                                    {notification.title}
                                                </h4>
                                                <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">
                                                {notification.message}
                                            </p>
                                        </div>

                                        {!notification.isRead && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification.id);
                                                }}
                                                className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 text-primary-600 hover:bg-primary-100 p-1 rounded-full transition-all"
                                                title="Mark as read"
                                            >
                                                <Check size={10} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
