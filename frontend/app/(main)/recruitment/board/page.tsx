'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { LayoutDashboard, Filter, Plus, Users, Search, MoreVertical, Star, Calendar, FileText } from 'lucide-react';
import api from '@/lib/api';
import ScheduleInterviewModal from '@/components/recruitment/ScheduleInterviewModal';
import GenerateOfferModal from '@/components/recruitment/GenerateOfferModal';

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

import { useSocket } from '@/contexts/SocketContext';

// ... existing interfaces ...

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

// StrictMode Droppable Fix
export const StrictModeDroppable = ({ children, ...props }: any) => {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);
    if (!enabled) {
        return null;
    }
    return <Droppable {...props}>{children}</Droppable>;
};

export default function KanbanBoardPage() {
    const [columns, setColumns] = useState<KanbanData>({});
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    useEffect(() => {
        loadBoard();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleMove = (data: any) => {
            console.log('Real-time move received:', data);

            setColumns(prev => {
                const newCols = { ...prev };
                let movedCandidate: Candidate | undefined;

                // 1. Remove from old column
                Object.keys(newCols).forEach(stage => {
                    const idx = newCols[stage].findIndex(c => c.id === data.candidateId);
                    if (idx !== -1) {
                        movedCandidate = newCols[stage][idx];
                        // If we have full candidate object in payload, use it, otherwise use existing
                        if (data.candidate) {
                            movedCandidate = { ...movedCandidate, ...data.candidate };
                        }
                        newCols[stage] = newCols[stage].filter(c => c.id !== data.candidateId);
                    }
                });

                // 2. Add to new column (if we found it or have data)
                if (data.candidate || movedCandidate) {
                    const targetStage = data.stage;
                    const candidateToAdd = data.candidate || { ...movedCandidate, currentStage: targetStage, status: data.status };

                    if (!newCols[targetStage]) newCols[targetStage] = [];
                    // Check if already exists to prevent duplicates
                    if (!newCols[targetStage].find(c => c.id === data.candidateId)) {
                        newCols[targetStage] = [candidateToAdd as Candidate, ...newCols[targetStage]];
                    }
                }

                return newCols;
            });
        };

        socket.on('recruitment:candidate-moved', handleMove);

        return () => {
            socket.off('recruitment:candidate-moved', handleMove);
        };
    }, [socket]);

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

    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
    const [dragResult, setDragResult] = useState<DropResult | null>(null);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceColumn = columns[source.droppableId];
        const destColumn = columns[destination.droppableId];
        const candidate = sourceColumn[source.index];

        // LOGIC: Save Drag Result and Candidate for later use (Revert/Commit)
        setDragResult(result);
        setActiveCandidate(candidate);

        // 1. Optimistic Update (Move UI Immediately)
        const newSource = Array.from(sourceColumn);
        newSource.splice(source.index, 1);
        const newDest = Array.from(destColumn);
        newDest.splice(destination.index, 0, candidate);

        setColumns({
            ...columns,
            [source.droppableId]: newSource,
            [destination.droppableId]: newDest
        });

        // 2. INTERCEPT: Check for Action Stages
        if (destination.droppableId === 'Interview' && source.droppableId !== 'Interview') {
            setShowInterviewModal(true);
            return; // STOP! Don't call API yet.
        }

        if (destination.droppableId === 'Offer' && source.droppableId !== 'Offer') {
            setShowOfferModal(true);
            return; // STOP! Don't call API yet.
        }

        // 3. DEFAULT: Update Stage for normal moves
        try {
            await api.put(`/recruitment/candidates/${draggableId}/stage`, {
                stage: destination.droppableId,
                status: destination.droppableId === 'Hired' ? 'hired' :
                    destination.droppableId === 'Rejected' ? 'rejected' : 'active'
            });
        } catch (error) {
            console.error('Failed to update stage:', error);
            loadBoard(); // Revert on failure
        }
    };

    const handleModalClose = () => {
        // Revert Drag if modal is closed without success
        setShowInterviewModal(false);
        setShowOfferModal(false);
        setActiveCandidate(null);
        setDragResult(null);
        loadBoard(); // Simply reload to revert to server state
    };

    const handleModalSuccess = () => {
        // Success! The API was called by the Modal.
        // We just need to close modals and reload board to get clean state
        setShowInterviewModal(false);
        setShowOfferModal(false);
        setActiveCandidate(null);
        setDragResult(null);
        // Optional: Keep optimistic state if logic matches, but reloading is safer to sync IDs/Metadata
        loadBoard();
    };

    if (loading) return <div className="p-8 text-center">Loading Board...</div>;

    return (
        <div className="h-full flex flex-col">
            {/* Page Header omitted for brevity in diff... keep existing */}
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-md border border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-900 rounded-md flex items-center justify-center shadow-md">
                        <LayoutDashboard size={16} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Candidate Pipeline</h2>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Visual Talent Acquisition Workflow</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Filters:</span>
                        <select className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-primary-600 focus:ring-0 p-0 cursor-pointer">
                            <option>ALL REQUISITIONS</option>
                        </select>
                    </div>
                    <div className="h-6 w-px bg-slate-200 mx-1" />
                    <button className="p-2 hover:bg-slate-100 text-slate-500 rounded-md transition-colors">
                        <Filter size={14} />
                    </button>
                    <button className="btn-primary py-2 px-4 shadow-lg shadow-primary-900/10 active:scale-95">
                        <Plus size={14} className="mr-2" /> Add Candidate
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full space-x-4">
                        {STAGES.map((stage) => (
                            <div key={stage} className="flex flex-col w-72 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 h-full max-h-full transition-all hover:bg-slate-50">
                                <div className="p-4 flex items-center justify-between border-b border-white/50">
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{stage}</span>
                                    <span className="h-5 w-5 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-primary-600 shadow-sm">
                                        {columns[stage]?.length || 0}
                                    </span>
                                </div>

                                <StrictModeDroppable droppableId={stage}>
                                    {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 p-3 overflow-y-auto transition-all scrollbar-thin scrollbar-thumb-slate-200 ${snapshot.isDraggingOver ? 'bg-primary-50/40' : ''}`}
                                        >
                                            {columns[stage]?.map((candidate, index) => (
                                                <Draggable
                                                    key={candidate.id}
                                                    draggableId={candidate.id}
                                                    index={index}
                                                >
                                                    {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`
                                                                bg-white p-3.5 mb-3 rounded-md border border-slate-100 shadow-sm
                                                                transition-all duration-200 group relative overflow-hidden
                                                                ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary-500/20 scale-[1.02] rotate-1 z-50' : 'hover:shadow-md hover:border-primary-100'}
                                                            `}
                                                            style={provided.draggableProps.style}
                                                        >
                                                            {/* Selection Indicator */}
                                                            <div className={`absolute top-0 left-0 bottom-0 w-1 ${candidate.status === 'rejected' ? 'bg-rose-400' :
                                                                candidate.status === 'hired' ? 'bg-emerald-400' :
                                                                    'bg-primary-600'
                                                                }`} />

                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight group-hover:text-primary-600 transition-colors">
                                                                        {candidate.firstName} {candidate.lastName}
                                                                    </h4>
                                                                    <p className="text-[9px] font-bold text-slate-400 truncate uppercase mt-0.5">
                                                                        {candidate.jobOpening?.title || 'GENERAL INTAKE'}
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    {(candidate.status === 'offer' || candidate.status === 'hired' || candidate.status === 'accepted') && (
                                                                        <button
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                try {
                                                                                    const res = await api.get(`/recruitment/candidates/${candidate.id}/offer/download`, { responseType: 'blob' });
                                                                                    const url = window.URL.createObjectURL(new Blob([res.data]));
                                                                                    const link = document.createElement('a');
                                                                                    link.href = url;
                                                                                    link.setAttribute('download', `Offer_${candidate.firstName}.pdf`);
                                                                                    document.body.appendChild(link);
                                                                                    link.click();
                                                                                    link.remove();
                                                                                } catch (err) {
                                                                                    console.error('Download failed', err);
                                                                                    // Use global toast if available or silent fail with log
                                                                                    console.error('Failed to download offer. Ensure offer details exist.');
                                                                                }
                                                                            }}
                                                                            className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                                                                            title="Download Offer Letter"
                                                                        >
                                                                            <FileText size={12} />
                                                                        </button>
                                                                    )}
                                                                    <button className="p-1 text-slate-300 hover:text-slate-600 rounded">
                                                                        <MoreVertical size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="flex items-center gap-1">
                                                                    <Star size={10} className="text-amber-400 fill-amber-400" />
                                                                    <span className="text-[10px] font-black text-slate-600">4.5</span>
                                                                </div>
                                                                <div className="h-3 w-px bg-slate-100" />
                                                                <div className="flex items-center gap-1 text-slate-400">
                                                                    <Calendar size={10} />
                                                                    <span className="text-[9px] font-bold">2D AGO</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                                <div className="flex -space-x-1.5 overflow-hidden">
                                                                    <div className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center">
                                                                        <Users size={10} className="text-slate-400" />
                                                                    </div>
                                                                </div>
                                                                <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${candidate.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                                                                    candidate.status === 'hired' ? 'bg-emerald-50 text-emerald-700' :
                                                                        'bg-primary-50 text-primary-700'
                                                                    }`}>
                                                                    {candidate.status}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </StrictModeDroppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>

            {/* Modals */}
            {activeCandidate && (
                <>
                    <ScheduleInterviewModal
                        isOpen={showInterviewModal}
                        onClose={handleModalClose}
                        onSuccess={handleModalSuccess}
                        candidateId={activeCandidate.id}
                        candidateName={`${activeCandidate.firstName} ${activeCandidate.lastName}`}
                    />
                    <GenerateOfferModal
                        isOpen={showOfferModal}
                        onClose={handleModalClose}
                        onSuccess={handleModalSuccess}
                        candidateId={activeCandidate.id}
                        candidateName={`${activeCandidate.firstName} ${activeCandidate.lastName}`}
                        jobTitle={activeCandidate.jobOpening?.title}
                    />
                </>
            )}
        </div>
    );
}
