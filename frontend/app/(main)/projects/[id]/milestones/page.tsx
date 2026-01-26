
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Flag, Calendar, CheckCircle, Circle, Plus, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ProjectMilestones({ params }: { params: { id: string } }) {
    const toast = useToast();
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newMilestone, setNewMilestone] = useState({ title: '', date: '', amount: '' });

    useEffect(() => {
        fetchMilestones();
    }, []);

    const fetchMilestones = async () => {
        try {
            // Assuming getProjectById includes milestones, or use a dedicated endpoint
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

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Project Roadmap</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Key Deliverables & Timeline</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={14} /> Add Milestone
                </button>
            </div>

            {/* Visual Timeline (Gantt-lite) */}
            <div className="ent-card p-8 overflow-x-auto">
                <div className="relative min-w-[600px] flex items-center justify-between pb-12 pt-4">
                    {/* Line */}
                    <div className="absolute top-8 left-0 right-0 h-1 bg-gray-100 rounded-full z-0"></div>

                    {milestones.length === 0 && (
                        <div className="flex items-center justify-center w-full py-8 text-gray-400 text-xs italic">
                            No milestones defined yet. Start by adding one.
                        </div>
                    )}

                    {milestones.map((m, index) => {
                        const isCompleted = m.status === 'completed';
                        return (
                            <div key={m.id} className="relative z-10 flex flex-col items-center group">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-300
                                    ${isCompleted
                                        ? 'bg-emerald-500 border-white text-white shadow-lg shadow-emerald-200 scale-110'
                                        : 'bg-white border-gray-200 text-gray-400 group-hover:border-primary-400 group-hover:text-primary-600'}
                                `}>
                                    {isCompleted ? <CheckCircle size={14} /> : <Flag size={14} />}
                                </div>
                                <div className="mt-4 text-center w-32">
                                    <h4 className={`text-xs font-bold transition-colors ${isCompleted ? 'text-gray-900' : 'text-gray-500 group-hover:text-primary-700'}`}>
                                        {m.title}
                                    </h4>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mt-1">
                                        {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'No Date'}
                                    </span>
                                </div>

                                {/* Connector Progress (fake for visual) */}
                                {index < milestones.length - 1 && (
                                    <div className={`absolute left-1/2 top-3 w-[calc(100%)] h-1 -z-10 bg-emerald-500 origin-left scale-x-0 transition-transform duration-700 delay-100 ${isCompleted ? 'scale-x-100' : ''}`} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Detailed List */}
            <div className="ent-card overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Milestone Details</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {milestones.map((m) => (
                        <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-md ${m.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <Flag size={16} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">{m.title}</h4>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                        <Calendar size={10} />
                                        Target: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'Pending'}
                                        {m.amount && (
                                            <span className="text-gray-300">|</span>
                                        )}
                                        {m.amount && (
                                            <span className="text-emerald-600 font-bold">${Number(m.amount).toLocaleString()}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border 
                                    ${m.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        m.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                            'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                    {m.status}
                                </span>
                                <button className="text-gray-400 hover:text-primary-600 transition-colors">
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

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
                                <label className="ent-label">Target Date</label>
                                <input
                                    type="date"
                                    className="ent-input"
                                    value={newMilestone.date}
                                    onChange={e => setNewMilestone({ ...newMilestone, date: e.target.value })}
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
