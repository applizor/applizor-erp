'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { Layout, Calendar, ChevronRight, ChevronLeft, Search, Plus, ListFilter } from 'lucide-react';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';

interface Epic {
    id: string;
    title: string;
    status: string;
    startDate: string | null;
    dueDate: string | null;
    _count?: { tasksInEpic: number };
}

export default function RoadmapPage() {
    const { id: projectId } = useParams();
    const [epics, setEpics] = useState<Epic[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEpic, setSelectedEpic] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const toast = useToast();

    // Timeline settings
    const [viewDate, setViewDate] = useState(new Date()); // Current month view
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    useEffect(() => {
        fetchEpics();
    }, [projectId]);

    const fetchEpics = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/tasks?projectId=${projectId}&type=epic`);
            setEpics(res.data);
        } catch (error) {
            toast.error('Failed to load roadmap');
        } finally {
            setLoading(false);
        }
    };

    // Calculate timeline dates (Current month + 2 months)
    const getTimelineDays = () => {
        const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const days = [];
        for (let i = 0; i < 90; i++) { // Show 90 days
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const timelineDays = getTimelineDays();
    const startDate = timelineDays[0];
    const endDate = timelineDays[timelineDays.length - 1];

    const getPosition = (dateStr: string | null) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        if (date < startDate || date > endDate) return null;

        const diffTime = Math.abs(date.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return (diffDays / 90) * 100; //Percentage
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Building Roadmap...</div>;

    return (
        <div className="space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Roadmap</h2>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Visual timeline of your project epics</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded border border-gray-200" onClick={() => {
                        const d = new Date(viewDate);
                        d.setMonth(d.getMonth() - 1);
                        setViewDate(d);
                    }}>
                        <ChevronLeft size={16} />
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded text-[10px] font-black uppercase tracking-widest" onClick={() => setViewDate(new Date())}>
                        Today
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded border border-gray-200" onClick={() => {
                        const d = new Date(viewDate);
                        d.setMonth(d.getMonth() + 1);
                        setViewDate(d);
                    }}>
                        <ChevronRight size={16} />
                    </button>
                    <button
                        onClick={() => {
                            setSelectedEpic('new');
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                    >
                        <Plus size={14} /> Create Epic
                    </button>
                </div>
            </div>

            <div className="ent-card flex-1 flex flex-col overflow-hidden min-h-[600px]">
                {/* Timeline Header */}
                <div className="flex border-b border-gray-100">
                    <div className="w-80 border-r border-gray-100 p-4 font-black text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                        Epic Details
                    </div>
                    <div className="flex-1 relative bg-gray-50/30">
                        <div className="flex h-full">
                            {/* Monthly Ticks */}
                            {[0, 30, 60].map(offset => {
                                const d = new Date(startDate);
                                d.setDate(d.getDate() + offset);
                                return (
                                    <div key={offset} className="flex-1 border-r border-gray-100/50 p-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                                        {months[d.getMonth()]} {d.getFullYear()}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Scoped Content */}
                <div className="flex-1 overflow-y-auto">
                    {epics.map(epic => {
                        const startPos = getPosition(epic.startDate);
                        const endPos = getPosition(epic.dueDate);

                        // Default bar if no dates
                        const hasDates = startPos !== null && endPos !== null;

                        return (
                            <div key={epic.id} className="group flex border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                <div className="w-80 border-r border-gray-100 p-4 flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center">
                                        <Layout size={12} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[12px] font-bold text-gray-900 truncate">{epic.title}</h4>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            {epic._count?.tasksInEpic || 0} Issues • {epic.status}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-1 relative h-16 p-4">
                                    {hasDates ? (
                                        <div
                                            onClick={() => {
                                                setSelectedEpic(epic.id);
                                                setIsModalOpen(true);
                                            }}
                                            className="absolute h-8 bg-purple-600 rounded-full shadow-lg shadow-purple-600/20 flex items-center px-4 group-hover:bg-purple-700 transition-all cursor-pointer border-2 border-white"
                                            style={{
                                                left: `${startPos}%`,
                                                width: `${Math.max(5, (endPos || 100) - (startPos || 0))}%`,
                                                top: '50%',
                                                transform: 'translateY(-50%)'
                                            }}
                                        >
                                            <span className="text-[9px] font-black text-white uppercase whitespace-nowrap overflow-hidden">
                                                {epic.title}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">Set dates to see on timeline</span>
                                        </div>
                                    )}

                                    {/* Vertical Day Grid (Subtle) */}
                                    <div className="absolute inset-0 flex pointer-events-none opacity-20">
                                        {[...Array(9)].map((_, i) => (
                                            <div key={i} className="flex-1 border-r border-gray-100 border-dashed" />
                                        ))}
                                    </div>

                                    {/* Today Indicator */}
                                    {getPosition(new Date().toISOString()) !== null && (
                                        <div
                                            className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-20 pointer-events-none flex flex-col items-center"
                                            style={{ left: `${getPosition(new Date().toISOString())}%` }}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-600 -translate-y-1/2" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {epics.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                <Search size={32} />
                            </div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1">No Epics Found</h3>
                            <p className="text-xs text-gray-500 max-w-xs">Create an issue with type &apos;Epic&apos; and set its start and due dates to visualize on the roadmap.</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && selectedEpic && (
                <TaskDetailModal
                    taskId={selectedEpic}
                    projectId={projectId as string}
                    onClose={() => setIsModalOpen(false)}
                    onUpdate={() => {
                        fetchEpics();
                        setIsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}

