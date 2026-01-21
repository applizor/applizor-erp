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
        <div className="h-full flex flex-col animate-fade-in">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 px-6 pt-4">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-3">
                        Acquisition Pipeline
                        {!loading && STAGES.length > 0 && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase font-black tracking-widest">
                                {STAGES.length} STAGES
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">
                        Strategic management of human capital acquisition through progressive evaluation stages.
                    </p>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:block">
                    Drag and drop candidates to evolve their status
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full space-x-4">
                        {STAGES.map((stage) => (
                            <div key={stage} className="flex flex-col w-72 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 h-full max-h-full transition-all hover:bg-slate-50">
                                <div className="p-4 flex items-center justify-between border-b border-white/50">
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{stage}</span>
                                    <span className="h-5 w-5 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm">
                                        {columns[stage]?.length || 0}
                                    </span>
                                </div>

                                <Droppable droppableId={stage}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 p-3 overflow-y-auto transition-all scrollbar-thin scrollbar-thumb-slate-200 ${snapshot.isDraggingOver ? 'bg-indigo-50/40' : ''}`}
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
                                                                bg-white p-3.5 mb-3 rounded-2xl border border-slate-100 shadow-sm
                                                                transition-all duration-200 group relative overflow-hidden
                                                                ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500/20 scale-[1.02] rotate-1 z-50' : 'hover:shadow-md hover:border-indigo-100'}
                                                            `}
                                                            style={provided.draggableProps.style}
                                                        >
                                                            {/* Accent Bar */}
                                                            <div className={`absolute top-0 left-0 bottom-0 w-1 ${candidate.status === 'rejected' ? 'bg-rose-400' :
                                                                candidate.status === 'hired' ? 'bg-emerald-400' :
                                                                    'bg-indigo-400'
                                                                }`} />

                                                            <div>
                                                                <div className="text-xs font-black text-slate-900 tracking-tight leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                                                                    {candidate.firstName} {candidate.lastName}
                                                                </div>
                                                                <div className="text-[9px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-tighter">
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                    {candidate.jobOpening?.title || 'General Intake'}
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 flex justify-between items-center">
                                                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-lg ${candidate.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                                                                    candidate.status === 'hired' ? 'bg-emerald-50 text-emerald-700' :
                                                                        'bg-slate-50 text-slate-500'
                                                                    }`}>
                                                                    {candidate.status}
                                                                </span>
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <div className="h-5 w-5 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 cursor-pointer">
                                                                        <span className="text-[10px] font-black">→</span>
                                                                    </div>
                                                                </div>
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
