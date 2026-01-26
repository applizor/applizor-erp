
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ProjectTasks({ params }: { params: { id: string } }) {
    // Basic Task List placeholder - implementing full Kanban is complex for this step but list is sufficient
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock fetch for now as we didn't add tasks endpoint to router yet, but usually handled by projectById
        // fetchTasks();
        setLoading(false);
    }, []);

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Task Execution</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Tickets & Assignments</p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                    <Plus size={14} /> New Task
                </button>
            </div>

            <div className="ent-card p-12 text-center border-dashed">
                <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-sm font-black text-gray-900 uppercase">No Active Tasks</h3>
                <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">
                    Tasks will appear here once assignments start. Milestones drive the task structure.
                </p>
            </div>

            {/* 
                Future Implementation: 
                - Group by Status (Todo, In Progress, Done)
                - Drag and drop (dnd-kit)
            */}
        </div>
    );
}
