'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { LayoutGrid, List as ListIcon, Plus, ChevronRight, TrendingUp, BarChart3, Activity } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { PermissionGuard } from '@/components/PermissionGuard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import { KanbanColumnSkeleton } from '@/components/skeletons/KanbanColumnSkeleton';

const STAGES = [
    { id: 'lead', name: 'Raw Inquiry', color: 'bg-primary-900', icon: '📝' },
    { id: 'contacted', name: 'Discovery', color: 'bg-primary-600', icon: '📞' },
    { id: 'qualified', name: 'Assessed', color: 'bg-primary-600', icon: '💎' },
    { id: 'proposal', name: 'Priced', color: 'bg-amber-600', icon: '📄' },
    { id: 'negotiation', name: 'Refining', color: 'bg-violet-600', icon: '🤝' },
    { id: 'won', name: 'Secured', color: 'bg-emerald-600', icon: '💰' },
    { id: 'lost', name: 'Shelved', color: 'bg-rose-600', icon: '🚫' }
];

export default function LeadKanbanPage() {
    const toast = useToast();
    const { formatCurrency } = useCurrency();
    const { can } = usePermission();
    const [kanban, setKanban] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadKanban();
    }, []);

    const loadKanban = async () => {
        try {
            setLoading(true);
            const response = await api.get('/leads/kanban/board');
            setKanban(response.data);
        } catch (error) {
            toast.error('Failed to load kanban board');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: any) => {
        if (!result.destination) return;
        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId) return;

        try {
            const newStage = destination.droppableId;
            const newStatus = newStage === 'won' ? 'won' : newStage === 'lost' ? 'lost' : undefined;

            await api.put(`/leads/${draggableId}/stage`, {
                stage: newStage,
                status: newStatus
            });

            toast.success('Strategy updated');
            loadKanban();
        } catch (error) {
            toast.error('Failed to update strategy');
        }
    };

    if (loading) return <KanbanColumnSkeleton />;

    return (
        <div className="space-y-6">
            {/* Semantic Header Component */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-900 rounded-md shadow-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Opportunity Pipeline</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            Revenue Acquisition Engine <ChevronRight size={10} className="text-primary-600" /> Kanban Intelligence
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="flex bg-gray-100 p-1 rounded-md font-black text-[9px] uppercase tracking-widest">
                        <button className="px-4 py-2 bg-white text-primary-600 shadow-sm rounded-md flex items-center gap-2 border border-gray-200">
                            Board View
                        </button>
                        <Link
                            href="/leads/list"
                            className="px-4 py-2 text-gray-400 hover:text-gray-600 rounded-md flex items-center gap-2 transition-all"
                        >
                            Ledger
                        </Link>
                    </div>
                    <PermissionGuard module="Lead" action="create">
                        <Link
                            href="/leads/create"
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={14} /> Acquire Lead
                        </Link>
                    </PermissionGuard>
                </div>
            </div>

            {/* Strategy Board */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-6 overflow-x-auto pb-12 px-2 snap-x hide-scrollbar">
                    {STAGES.map(stage => {
                        const leads = kanban[stage.id] || [];
                        const totalValue = leads.reduce((sum: number, l: any) => sum + (Number(l.value) || 0), 0);

                        return (
                            <div key={stage.id} className="flex flex-col min-w-[300px] max-w-[300px] snap-center">
                                {/* Stage Identifier */}
                                <div className="mb-4 px-2 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 ${stage.color} rounded-md shadow-lg flex items-center justify-center text-[12px]`}>
                                            <span className="brightness-200">{stage.icon}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900 tracking-tight leading-none mb-1 text-[11px] uppercase">
                                                {stage.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{leads.length} Entities</span>
                                                <div className="w-1 h-1 rounded-full bg-gray-200" />
                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{formatCurrency(totalValue)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-gray-300 hover:text-primary-600 transition-colors">
                                        <Plus size={16} />
                                    </button>
                                </div>

                                {/* Droppable Area - Strategic Pipeline */}
                                <Droppable droppableId={stage.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 rounded-md p-3 min-h-[600px] space-y-4 transition-all duration-300 border-2 border-dashed ${snapshot.isDraggingOver ? 'bg-primary-50/50 border-primary-200' : 'bg-gray-50/30 border-transparent'}`}
                                        >
                                            {leads.map((lead: any, index: number) => (
                                                <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`ent-card p-4 relative overflow-hidden transition-all duration-300 ${snapshot.isDragging ? 'shadow-2xl scale-105 ring-2 ring-primary-500/20 z-50' : 'hover:shadow-md hover:-translate-y-0.5'}`}
                                                        >
                                                            <div className="space-y-3">
                                                                <Link href={`/leads/${lead.id}`} className="block group">
                                                                    <h4 className="font-black text-gray-900 tracking-tight mb-2 group-hover:text-primary-600 transition-colors leading-none text-[13px] uppercase">
                                                                        {lead.name}
                                                                    </h4>
                                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none flex items-center gap-2">
                                                                        <Activity size={10} className="text-primary-600" />
                                                                        {lead.company || 'Private Entity'}
                                                                    </p>
                                                                </Link>

                                                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                                                    <div className="text-[14px] font-black text-gray-900 tracking-tight">
                                                                        {formatCurrency(lead.value || 0)}
                                                                    </div>
                                                                    {lead.priority && (
                                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${lead.priority === 'high' || lead.priority === 'urgent'
                                                                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                                            : 'bg-primary-50 text-primary-700 border-primary-100'
                                                                            }`}>
                                                                            {lead.priority}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {lead.nextFollowUpAt && (
                                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md border border-gray-100 italic">
                                                                        <BarChart3 size={10} className="text-gray-400" />
                                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                                            SYNC: {new Date(lead.nextFollowUpAt).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}

                                            {leads.length === 0 && !snapshot.isDraggingOver && (
                                                <div className="h-40 flex flex-col items-center justify-center opacity-30 mt-10">
                                                    <BarChart3 size={32} className="text-gray-300 mb-2" />
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Zero Active Intel</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}
