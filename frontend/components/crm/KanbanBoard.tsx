'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { MoreVertical, Plus } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

interface Lead {
    id: string;
    name: string;
    company: string;
    value: number;
    stage: string;
    status: string;
}

interface KanbanBoardProps {
    initialLeads: Lead[];
    onStageChange: (leadId: string, newStage: string) => void;
}

const STAGES = {
    'lead': 'New Lead',
    'proposal': 'Proposal',
    'negotiation': 'Negotiation',
    'closed': 'Closed'
};

export default function KanbanBoard({ initialLeads, onStageChange }: KanbanBoardProps) {
    const { formatCurrency } = useCurrency();
    // Group leads by stage
    const [leads, setLeads] = useState(initialLeads);

    const getLeadsByStage = (stage: string) => {
        return leads.filter(l => l.stage === stage);
    };

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStage = destination.droppableId;

        // Update local state optimistic UI
        const updatedLeads = leads.map(l => {
            if (l.id === draggableId) {
                return { ...l, stage: newStage };
            }
            return l;
        });
        setLeads(updatedLeads);

        // Call API
        onStageChange(draggableId, newStage);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full overflow-x-auto space-x-4 pb-4">
                {Object.entries(STAGES).map(([stageKey, stageName]) => (
                    <div key={stageKey} className="flex-shrink-0 w-80 bg-gray-100 rounded-lg flex flex-col max-h-full">
                        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                {stageName}
                            </h3>
                            <span className="bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                                {getLeadsByStage(stageKey).length}
                            </span>
                        </div>

                        <Droppable droppableId={stageKey}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-1 p-2 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200' : ''
                                        }`}
                                >
                                    {getLeadsByStage(stageKey).map((lead, index) => (
                                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`bg-white p-3 rounded shadow-sm mb-3 border border-gray-200 hover:shadow-md transition-shadow group ${snapshot.isDragging ? 'shadow-lg rotate-2 z-50' : ''
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-medium text-gray-900 truncate pr-2">{lead.name}</h4>
                                                        <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical size={16} />
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-2 truncate">{lead.company}</p>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="font-medium text-gray-900">
                                                            {lead.value ? formatCurrency(lead.value) : '-'}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                                            lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {lead.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        <div className="p-2 border-t border-gray-200">
                            <button className="flex items-center text-gray-500 hover:text-gray-700 text-sm font-medium w-full p-1 rounded hover:bg-gray-200 transition-colors">
                                <Plus size={16} className="mr-1" /> Add Card
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
