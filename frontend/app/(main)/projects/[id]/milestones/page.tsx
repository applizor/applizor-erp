'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { Flag, Calendar, CheckCircle, Plus, MoreHorizontal, ArrowRight, LayoutList, Kanban } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ProjectMilestones({ params }: { params: { id: string } }) {
    const toast = useToast();
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
    const [showModal, setShowModal] = useState(false);
    const [newMilestone, setNewMilestone] = useState({ title: '', dueDate: '', amount: '' });

    useEffect(() => {
        fetchMilestones();
    }, []);

    const fetchMilestones = async () => {
        try {
            const res = await api.get(`/projects/${params.id}`);
            if (res.data.milestones) {
                setMilestones(res.data.milestones);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await api.post(`/projects/${params.id}/milestones`, newMilestone);
            toast.success('Milestone Created');
            setShowModal(false);
            fetchMilestones();
        } catch (error) {
            toast.error('Failed to create milestone');
        }
    };

    // --- Gantt Logic ---
    const timelineDates = useMemo(() => {
        if (milestones.length === 0) return { start: null, end: null, months: [] };
        // Find min and max dates
        const dates = milestones.map((m: any) => new Date(m.dueDate || new Date()).getTime());
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        // Pad 1 month before and after
        minDate.setMonth(minDate.getMonth() - 1);
        maxDate.setMonth(maxDate.getMonth() + 2);

        const months: Date[] = [];
        let current = new Date(minDate);
        while (current <= maxDate) {
            months.push(new Date(current));
            current.setMonth(current.getMonth() + 1);
        }
        return { start: minDate, end: maxDate, months };
    }, [milestones]);

    const getPosition = (dateStr: string) => {
        if (!dateStr || !timelineDates.start) return 0;
        const date = new Date(dateStr).getTime();
        const start = timelineDates.start.getTime();
        const end = timelineDates.end!.getTime();
        const totalDuration = end - start;
        const position = date - start;
        return (position / totalDuration) * 100;
    };

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex justify-between items-center bg-white p-2 rounded-md border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded">
                    <button
                        onClick={() => setViewMode('timeline')}
                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all
                            ${viewMode === 'timeline' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
                    >
                        <Kanban size={12} /> Timeline
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all
                            ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
                    >
                        <LayoutList size={12} /> List
                    </button>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2 py-1.5 px-3"
                >
                    <Plus size={12} /> <span className="text-[10px]">Add Milestone</span>
                </button>
            </div>

            {/* View: Timeline (Gantt) */}
            {viewMode === 'timeline' && (
                <div className="ent-card p-0 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Project Schedule</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Completed</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Pending</span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[800px] p-6">
                            {/* Months Header */}
                            <div className="flex border-b border-gray-100 pb-2 mb-4">
                                {timelineDates.months?.map((month: Date, idx: number) => (
                                    <div key={idx} className="flex-1 text-[9px] font-black text-gray-400 uppercase tracking-widest border-l border-gray-50 pl-2">
                                        {month.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </div>
                                ))}
                            </div>

                            {/* Milestones Rows */}
                            <div className="space-y-6 relative">
                                {/* Grid Lines (Vertical) - Approximate */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                    {timelineDates.months?.map((_: any, idx: number) => (
                                        <div key={idx} className="flex-1 border-l border-dashed border-gray-50 h-full" />
                                    ))}
                                </div>

                                {milestones.map((m) => (
                                    <div key={m.id} className="relative h-12 flex items-center group">
                                        {/* Label Line */}
                                        <div
                                            className="absolute h-[1px] bg-gray-100 top-1/2 w-full group-hover:bg-primary-50 transition-colors"
                                            style={{ left: 0, right: 0 }}
                                        />

                                        {/* Marker */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center z-10 cursor-pointer"
                                            style={{ left: `${getPosition(m.dueDate)}%` }}
                                        >
                                            <div className={`w-3 h-3 rotate-45 border-2 transition-all duration-300
                                                ${m.status === 'completed'
                                                    ? 'bg-emerald-500 border-emerald-600 shadow-md shadow-emerald-200'
                                                    : 'bg-white border-gray-400 group-hover:border-primary-500 group-hover:bg-primary-50'
                                                }`}
                                            />
                                            <div className="mt-4 bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm border border-gray-100 text-center whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity absolute top-2">
                                                <p className="text-[9px] font-black text-gray-900 uppercase">{m.title}</p>
                                                <p className="text-[8px] text-gray-400 font-bold">{new Date(m.dueDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {milestones.length === 0 && (
                                    <div className="text-center py-12 text-[10px] text-gray-400 italic">
                                        No milestones to display on timeline.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View: Dense List */}
            {viewMode === 'list' && (
                <div className="ent-card overflow-hidden">
                    <table className="ent-table w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Status</th>
                                <th className="text-left py-3 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Milestone</th>
                                <th className="text-left py-3 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Due Date</th>
                                <th className="text-right py-3 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Amount</th>
                                <th className="text-right py-3 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {milestones.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="py-2 px-4">
                                        <div className={`w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border 
                                            ${m.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                m.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                    'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                            {m.status}
                                        </div>
                                    </td>
                                    <td className="py-2 px-4">
                                        <p className="text-[11px] font-bold text-gray-900">{m.title}</p>
                                        <p className="text-[9px] text-gray-400 truncate max-w-[200px]">{m.description || 'No description'}</p>
                                    </td>
                                    <td className="py-2 px-4">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-600 font-bold">
                                            <Calendar size={12} className="text-gray-300" />
                                            {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : '-'}
                                        </div>
                                    </td>
                                    <td className="py-2 px-4 text-right">
                                        {m.amount ? (
                                            <span className="text-[10px] font-bold text-gray-900">${Number(m.amount).toLocaleString()}</span>
                                        ) : (
                                            <span className="text-[10px] text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 text-right">
                                        <button className="text-gray-300 hover:text-primary-600 p-1">
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {milestones.length === 0 && (
                        <div className="text-center py-8 text-[10px] text-gray-400 italic">No milestones found.</div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95">
                        <h3 className="text-lg font-black text-gray-900 uppercase mb-4">New Milestone</h3>
                        <div className="space-y-4">
                            <div className="ent-form-group">
                                <label className="ent-label">Title</label>
                                <input
                                    type="text"
                                    className="ent-input"
                                    value={newMilestone.title}
                                    onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                                />
                            </div>
                            <div className="ent-form-group">
                                <label className="ent-label">Due Date</label>
                                <input
                                    type="date"
                                    className="ent-input"
                                    value={newMilestone.dueDate}
                                    onChange={e => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="ent-form-group">
                                <label className="ent-label">Billable Amount (Optional)</label>
                                <input
                                    type="number"
                                    className="ent-input"
                                    value={newMilestone.amount}
                                    onChange={e => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleCreate} className="btn-primary">Create Milestone</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
