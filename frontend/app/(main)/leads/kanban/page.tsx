'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { LayoutGrid, List as ListIcon, Plus } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { PermissionGuard } from '@/components/PermissionGuard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';

const STAGES = [
    { id: 'lead', name: 'New Leads', color: 'bg-gray-100', textColor: 'text-gray-700' },
    { id: 'contacted', name: 'Contacted', color: 'bg-blue-100', textColor: 'text-blue-700' },
    { id: 'qualified', name: 'Qualified', color: 'bg-green-100', textColor: 'text-green-700' },
    { id: 'proposal', name: 'Proposal', color: 'bg-yellow-100', textColor: 'text-yellow-700' },
    { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-100', textColor: 'text-orange-700' },
    { id: 'won', name: 'Won', color: 'bg-emerald-100', textColor: 'text-emerald-700' },
    { id: 'lost', name: 'Lost', color: 'bg-red-100', textColor: 'text-red-700' }
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

            toast.success('Lead stage updated successfully');
            loadKanban();
        } catch (error) {
            toast.error('Failed to update lead stage');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Sales Pipeline</h1>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            className="p-2 bg-white text-primary-600 shadow-sm rounded-md"
                            title="Kanban View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <Link
                            href="/leads/list"
                            className="p-2 text-gray-500 hover:text-gray-900 rounded-md"
                            title="List View"
                        >
                            <ListIcon className="w-4 h-4" />
                        </Link>
                    </div>
                    <PermissionGuard module="Lead" action="create">
                        <Link
                            href="/leads/create"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Lead
                        </Link>
                    </PermissionGuard>
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-7 gap-4 overflow-x-auto">
                    {STAGES.map(stage => (
                        <div key={stage.id} className="flex flex-col min-w-[250px]">
                            <div className={`${stage.color} p-3 rounded-t-lg border-b-2 border-gray-300`}>
                                <h3 className={`font-semibold text-sm ${stage.textColor}`}>
                                    {stage.name}
                                </h3>
                                <span className="text-xs text-gray-600">
                                    {kanban[stage.id]?.length || 0} leads
                                </span>
                            </div>

                            <Droppable droppableId={stage.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`bg-gray-50 p-2 min-h-[600px] space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        {kanban[stage.id]?.map((lead: any, index: number) => (
                                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move border border-gray-200 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''
                                                            }`}
                                                    >
                                                        <Link href={`/leads/${lead.id}`}>
                                                            <h4 className="font-medium text-sm text-gray-900 hover:text-primary-600">
                                                                {lead.name}
                                                            </h4>
                                                        </Link>

                                                        {lead.company && (
                                                            <p className="text-xs text-gray-500 mt-1">{lead.company}</p>
                                                        )}

                                                        {lead.value && (
                                                            <p className="text-xs font-semibold text-green-600 mt-2">
                                                                {formatCurrency(lead.value)}
                                                            </p>
                                                        )}

                                                        {lead.priority && lead.priority !== 'medium' && (
                                                            <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded ${lead.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                                lead.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {lead.priority}
                                                            </span>
                                                        )}

                                                        {lead.nextFollowUpAt && (
                                                            <div className="mt-2 text-xs text-gray-500 flex items-center">
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                {new Date(lead.nextFollowUpAt).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {(!kanban[stage.id] || kanban[stage.id].length === 0) && (
                                            <div className="text-center text-gray-400 text-sm py-8">
                                                No leads
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
