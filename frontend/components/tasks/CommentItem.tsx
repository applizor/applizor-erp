'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Reply, Trash2, Lock, MoreHorizontal, Check, X } from 'lucide-react';

interface CommentItemProps {
    comment: any;
    onReply: (comment: any) => void;
    onDelete?: (commentId: string) => void;
    currentUserId?: string;
    isReply?: boolean;
}

function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
    const colors = [
        'bg-blue-600 text-white',
        'bg-emerald-600 text-white',
        'bg-violet-600 text-white',
        'bg-amber-600 text-white',
        'bg-rose-600 text-white',
        'bg-cyan-600 text-white',
        'bg-indigo-600 text-white',
    ];
    const index = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
    return colors[index];
}

function timeAgo(date: string) {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CommentItem({ comment, onReply, onDelete, currentUserId, isReply = false }: CommentItemProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Guest user: comment starts with [Name] prefix from Teams
    const isGuestComment = !comment.user && !comment.client && comment.content?.startsWith('[');
    const guestName = isGuestComment
        ? comment.content.match(/^\[([^\]]+)\]/)?.[1] || 'Unknown'
        : null;

    const authorName = comment.user
        ? `${comment.user.firstName} ${comment.user.lastName}`
        : comment.client ? `${comment.client.name} (Client)`
        : guestName ? guestName
        : 'System';

    const isClient = !!comment.clientId;
    const isOwner = String(comment.userId) === String(currentUserId);
    const canDelete = onDelete && (isOwner || !comment.user);
    const avatarClass = getAvatarColor(authorName);

    const handleDelete = () => {
        if (confirmDelete) {
            onDelete?.(comment.id);
        } else {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 5000);
        }
    };

    return (
        <div className={`group ${isReply ? 'ml-8 mt-2' : ''}`}>
            <div className={`flex gap-3 ${comment.isInternal ? 'bg-indigo-50/40 rounded-lg p-3 border border-indigo-100/50' : ''}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarClass}`}>
                    {getInitials(authorName)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-semibold text-slate-900">{authorName}</span>
                        <span className="text-[11px] text-slate-400">{timeAgo(comment.createdAt)}</span>
                        {isClient && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">Client</span>
                        )}
                        {comment.isInternal && (
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Lock size={8} /> Internal
                            </span>
                        )}
                    </div>

                    {/* Body */}
                    <div
                        className="text-[13px] text-slate-700 leading-relaxed mt-0.5"
                        dangerouslySetInnerHTML={{ __html: isGuestComment ? comment.content.replace(/^\[[^\]]+\]\s*/, '') : comment.content }}
                    />

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onReply(comment)}
                            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 transition-colors"
                        >
                            <Reply size={11} /> Reply
                        </button>
                        {canDelete && (
                            confirmDelete ? (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700 font-medium"
                                    >
                                        <Check size={11} /> Delete
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete(false)}
                                        className="text-[11px] text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={11} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={11} /> Delete
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-4 border-l-2 border-slate-100 pl-4 mt-2 space-y-2">
                    {comment.replies.map((reply: any) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            onReply={onReply}
                            onDelete={onDelete}
                            currentUserId={currentUserId}
                            isReply={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
