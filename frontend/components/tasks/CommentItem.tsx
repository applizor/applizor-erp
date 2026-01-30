'use client';

import React from 'react';
import { MessageSquare, Heart, Smile, MoreHorizontal, Send, Trash2 } from 'lucide-react';

interface CommentItemProps {
    comment: any;
    onReply: (comment: any) => void;
    onDelete?: (commentId: string) => void;
    currentUserId?: string;
    isReply?: boolean;
}

export default function CommentItem({ comment, onReply, onDelete, currentUserId, isReply = false }: CommentItemProps) {
    const [isDeleting, setIsDeleting] = React.useState(false);

    const authorName = comment.user
        ? `${comment.user.firstName} ${comment.user.lastName}`
        : comment.client ? `${comment.client.name} (Client)` : 'Unknown';

    const isClient = !!comment.clientId;
    const isOwner = comment.userId === currentUserId;
    // We can also pass an isAdmin prop if needed, or just let pure RBAC handle the error if not owner.
    // For now, show delete if owner or if onDelete is present (parent decides).
    const canDelete = onDelete && (isOwner || !comment.user); // Allow deleting system/client notes if admin? Let's just stick to owner for now or valid callback.

    const handleDeleteClick = () => {
        if (!onDelete) return;
        if (isDeleting) {
            onDelete(comment.id);
        } else {
            setIsDeleting(true);
            setTimeout(() => setIsDeleting(false), 3000); // Reset after 3s
        }
    };

    return (
        <div className={`relative flex gap-3 ${isReply ? 'ml-11 mt-1' : ''}`}>
            {/* Visual connector for replies */}
            {isReply && (
                <div className="absolute -left-6 top-0 bottom-4 w-px bg-slate-200" />
            )}

            <div className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 relative z-10 ring-2 ring-white shadow-sm ${isClient ? 'bg-amber-100 text-amber-700' : 'bg-slate-900 text-white'}`}>
                {authorName[0]}
            </div>

            <div className="flex-1 space-y-2">
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:border-slate-300 transition-all relative group">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-900 leading-none">{authorName}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">• {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isClient && <span className="bg-amber-100 text-amber-700 text-[8px] px-1 rounded font-black uppercase tracking-tighter">Client</span>}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-slate-400 hover:text-rose-500 transition-colors"><Heart size={12} /></button>
                            {/* <button className="text-slate-400 hover:text-slate-600 transition-colors"><MoreHorizontal size={14} /></button> */}
                        </div>
                    </div>

                    <div className="text-[12px] text-slate-600 prose prose-sm max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: comment.content }} />

                    <div className="mt-2 flex items-center justify-between border-t border-slate-50 pt-2">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onReply(comment)}
                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
                            >
                                <MessageSquare size={10} /> Reply
                            </button>
                            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 flex items-center gap-1.5 transition-colors">
                                <Smile size={10} /> React
                            </button>
                        </div>

                        {canDelete && (
                            <button
                                onClick={handleDeleteClick}
                                className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${isDeleting ? 'text-rose-600' : 'text-slate-300 hover:text-rose-500'}`}
                            >
                                {isDeleting ? 'Confirm?' : <><Trash2 size={10} /> Delete</>}
                            </button>
                        )}
                    </div>
                </div>

                {/* Recursive Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="space-y-3">
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
        </div>
    );
}
