'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import api from '@/lib/api';

interface Candidate {
    id: string;
    firstName: string;
    lastName: string;
    jobOpening?: {
        title: string;
    };
    status: string;
    currentStage?: string;
}

interface KanbanData {
    [key: string]: Candidate[];
}

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

export default function KanbanBoardPage() {
    const [columns, setColumns] = useState<KanbanData>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBoard();
    }, []);

    const loadBoard = async () => {
        try {
            setLoading(true);
            const response = await api.get('/recruitment/kanban');
            setColumns(response.data);
        } catch (error) {
            console.error('Failed to load kanban:', error);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const sourceColumn = columns[source.droppableId];
        const destColumn = columns[destination.droppableId];
        const candidate = sourceColumn[source.index];

        // Optimistic update
        const newSource = Array.from(sourceColumn);
        newSource.splice(source.index, 1);

        const newDest = Array.from(destColumn);
        newDest.splice(destination.index, 0, candidate);

        setColumns({
            ...columns,
            [source.droppableId]: newSource,
            [destination.droppableId]: newDest
        });

        // API Call
        try {
            await api.put(`/recruitment/candidates/${draggableId}/stage`, {
                stage: destination.droppableId,
                status: destination.droppableId === 'Hired' ? 'hired' :
                    destination.droppableId === 'Rejected' ? 'rejected' : 'active'
            });
        } catch (error) {
            console.error('Failed to update stage:', error);
            // Revert on error (could implement full revert logic here)
            loadBoard();
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Board...</div>;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b bg-white flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Recruitment Pipeline</h2>
                <div className="text-sm text-gray-500">Drag and drop candidates to move them between stages</div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-100 p-6">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full space-x-4">
                        {STAGES.map((stage) => (
                            <div key={stage} className="flex flex-col w-80 bg-gray-50 rounded-lg border border-gray-200 shadow-sm h-full max-h-full">
                                <div className="p-3 font-semibold text-gray-700 border-b bg-white rounded-t-lg flex justify-between">
                                    <span>{stage}</span>
                                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                                        {columns[stage]?.length || 0}
                                    </span>
                                </div>

                                <Droppable droppableId={stage}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 p-2 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            {columns[stage]?.map((candidate, index) => (
                                                <Draggable
                                                    key={candidate.id}
                                                    draggableId={candidate.id}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`
                                                                bg-white p-4 mb-3 rounded shadow-sm border border-gray-100
                                                                hover:shadow-md transition-shadow cursor-move
                                                                ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500 rotate-2' : ''}
                                                            `}
                                                            style={provided.draggableProps.style}
                                                        >
                                                            <div className="font-medium text-gray-900">
                                                                {candidate.firstName} {candidate.lastName}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {candidate.jobOpening?.title || 'General App'}
                                                            </div>
                                                            <div className="mt-2 flex justify-between items-center">
                                                                <span className={`text-xs px-1.5 py-0.5 rounded ${candidate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                        candidate.status === 'hired' ? 'bg-green-100 text-green-800' :
                                                                            'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                    {candidate.status}
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
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>
        </div>
    );
}
