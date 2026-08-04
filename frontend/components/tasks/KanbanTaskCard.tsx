'use client';

import React, { useRef } from 'react';
import {
    Draggable,
    DraggableProvided,
    DraggableStateSnapshot,
    DraggableRubric,
} from '@hello-pangea/dnd';
import {
    MoreVertical, MessageSquare, Bug, Bookmark, Layout, CheckSquare,
    Users, Clock, ListTree
} from 'lucide-react';

export interface KanbanTask {
    id: string;
    title: string;
    status: string;
    type: string;
    priority: string;
    storyPoints?: number;
    project?: { id: string; name: string };
    assignee?: { id: string; firstName: string; lastName: string };
    hasUnansweredComment?: boolean;
    _count?: { comments: number; documents: number; subtasks: number };
}

export function priorityBadgeClass(priority: string): string {
    switch ((priority || '').toLowerCase()) {
        case 'urgent':
            return 'bg-rose-50 text-rose-600 border-rose-100';
        case 'high':
            return 'bg-orange-50 text-orange-600 border-orange-100';
        case 'medium':
            return 'bg-amber-50 text-amber-700 border-amber-100';
        case 'low':
            return 'bg-sky-50 text-sky-600 border-sky-100';
        default:
            return 'bg-slate-50 text-slate-500 border-slate-100';
    }
}

function taskCardShellClass(
    task: KanbanTask,
    snapshot: Pick<DraggableStateSnapshot, 'isDragging' | 'isDropAnimating'>,
    isDragDisabled: boolean,
    isClone = false
): string {
    const lifting = snapshot.isDragging || snapshot.isDropAnimating || isClone;
    return [
        'kanban-card bg-white p-3.5 rounded-lg border shadow-sm group select-none',
        task.hasUnansweredComment
            ? 'border-amber-400 ring-2 ring-amber-400/20 animate-pulse-subtle'
            : 'border-slate-200',
        isClone ? 'kanban-card-clone' : '',
        snapshot.isDragging ? 'is-dragging' : '',
        snapshot.isDropAnimating ? 'is-drop-animating' : '',
        lifting
            ? 'z-[100] cursor-grabbing'
            : isDragDisabled
                ? 'cursor-pointer'
                : 'cursor-grab',
    ]
        .filter(Boolean)
        .join(' ');
}

interface KanbanTaskCardBodyProps {
    task: KanbanTask;
    isSelected: boolean;
    isMenuOpen: boolean;
    showProjectTag?: boolean;
    onSelect?: (taskId: string) => void;
    onMenuToggle?: (e: React.MouseEvent, taskId: string) => void;
    onQuickLog?: (task: KanbanTask) => void;
    isClone?: boolean;
}

export function KanbanTaskCardBody({
    task,
    isSelected,
    isMenuOpen,
    showProjectTag = false,
    onSelect,
    onMenuToggle,
    onQuickLog,
    isClone = false,
}: KanbanTaskCardBodyProps) {
    return (
        <>
            {showProjectTag && task.project && (
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 truncate">
                    {task.project.name}
                </div>
            )}

            <div className="flex justify-between items-start mb-2.5">
                <div className="flex gap-1.5 flex-wrap items-center">
                    {!isClone && (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                                e.stopPropagation();
                                onSelect?.(task.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mr-1.5 cursor-pointer"
                        />
                    )}
                    <span
                        className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${priorityBadgeClass(task.priority)}`}
                    >
                        {task.priority}
                    </span>
                    {task.hasUnansweredComment && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-500 text-white border-amber-600 animate-pulse">
                            Client Message
                        </span>
                    )}
                </div>

                {!isClone && (
                    <button
                        type="button"
                        onClick={(e) => onMenuToggle?.(e, task.id)}
                        className={`p-1 rounded transition-colors ${
                            isMenuOpen
                                ? 'bg-slate-100 text-slate-900'
                                : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-600'
                        }`}
                    >
                        <MoreVertical size={14} />
                    </button>
                )}
            </div>

            <h4 className="text-xs font-bold text-slate-800 mb-2 leading-relaxed line-clamp-2">
                {task.title}
            </h4>

            <div className="flex items-center justify-between mt-3 border-t border-slate-50 pt-2.5">
                <div className="flex items-center gap-2">
                    <div title={task.type}>
                        {task.type === 'bug' ? (
                            <Bug size={14} className="text-rose-500" />
                        ) : task.type === 'story' ? (
                            <Bookmark size={14} className="text-emerald-500" />
                        ) : task.type === 'epic' ? (
                            <Layout size={14} className="text-purple-600" />
                        ) : (
                            <CheckSquare size={14} className="text-blue-500" />
                        )}
                    </div>
                    {task.storyPoints ? (
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-black">
                            {task.storyPoints}
                        </span>
                    ) : null}
                </div>

                <div className="flex items-center gap-3">
                    {(task._count?.subtasks || 0) > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400" title="Subtasks">
                            <ListTree size={12} /> {task._count?.subtasks}
                        </div>
                    )}
                    {(task._count?.comments || 0) > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <MessageSquare size={12} /> {task._count?.comments}
                        </div>
                    )}

                    <div className="flex -space-x-2">
                        {task.assignee ? (
                            <div
                                title={`${task.assignee.firstName} ${task.assignee.lastName}`}
                                className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black border-2 border-white uppercase shadow-sm"
                            >
                                {task.assignee.firstName[0]}
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-300 flex items-center justify-center border-2 border-white shadow-sm">
                                <Users size={12} />
                            </div>
                        )}
                    </div>

                    {!isClone && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onQuickLog?.(task);
                            }}
                            className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-colors"
                        >
                            <Clock size={12} />
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

interface KanbanTaskCardProps {
    task: KanbanTask;
    index: number;
    isSelected: boolean;
    isMenuOpen: boolean;
    isDragDisabled?: boolean;
    showProjectTag?: boolean;
    onSelect: (taskId: string) => void;
    onOpen: (taskId: string) => void;
    onMenuToggle: (e: React.MouseEvent, taskId: string) => void;
    onQuickLog: (task: KanbanTask) => void;
}

/**
 * In-list draggable card. Visual drag preview is rendered via Droppable `renderClone`
 * (portaled to document.body) so sidebar/layout offsets cannot shove the card sideways.
 */
export const KanbanTaskCard = React.memo(function KanbanTaskCard({
    task,
    index,
    isSelected,
    isMenuOpen,
    isDragDisabled = false,
    showProjectTag = false,
    onSelect,
    onOpen,
    onMenuToggle,
    onQuickLog,
}: KanbanTaskCardProps) {
    const dragMovedRef = useRef(false);

    return (
        <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
                if (snapshot.isDragging) dragMovedRef.current = true;

                return (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={provided.draggableProps.style}
                        onClick={() => {
                            if (dragMovedRef.current) {
                                dragMovedRef.current = false;
                                return;
                            }
                            onOpen(task.id);
                        }}
                        className={taskCardShellClass(task, snapshot, isDragDisabled)}
                    >
                        <KanbanTaskCardBody
                            task={task}
                            isSelected={isSelected}
                            isMenuOpen={isMenuOpen}
                            showProjectTag={showProjectTag}
                            onSelect={onSelect}
                            onMenuToggle={onMenuToggle}
                            onQuickLog={onQuickLog}
                        />
                    </div>
                );
            }}
        </Draggable>
    );
});

/** Portaled drag preview — keeps the card glued to the cursor (no right-jump). */
export function createKanbanTaskCloneRenderer(
    findTask: (draggableId: string) => KanbanTask | undefined,
    options?: { showProjectTag?: boolean | (() => boolean) }
) {
    return (
        provided: DraggableProvided,
        snapshot: DraggableStateSnapshot,
        rubric: DraggableRubric
    ) => {
        const task = findTask(rubric.draggableId);
        if (!task) return null;
        const showProjectTag = typeof options?.showProjectTag === 'function'
            ? options.showProjectTag()
            : !!options?.showProjectTag;

        return (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                style={{
                    ...provided.draggableProps.style,
                    boxShadow: snapshot.isDropAnimating
                        ? '0 8px 20px -8px rgba(15, 23, 42, 0.18)'
                        : '0 18px 40px -12px rgba(15, 23, 42, 0.28), 0 0 0 2px rgba(59, 130, 246, 0.22)',
                }}
                className={taskCardShellClass(task, snapshot, false, true)}
            >
                <KanbanTaskCardBody
                    task={task}
                    isSelected={false}
                    isMenuOpen={false}
                    showProjectTag={showProjectTag}
                    isClone
                />
            </div>
        );
    };
}

export function KanbanColumnEmpty({ isDraggingOver }: { isDraggingOver: boolean }) {
    return (
        <div
            className={`flex flex-col items-center justify-center py-10 px-4 text-center rounded-lg border border-dashed transition-colors duration-150 ${
                isDraggingOver
                    ? 'border-primary-300 bg-primary-50/50'
                    : 'border-slate-200/80 bg-white/40'
            }`}
        >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {isDraggingOver ? 'Drop here' : 'Drop tasks here'}
            </p>
        </div>
    );
}

export function KanbanCountBadge({ count }: { count: number }) {
    return (
        <span className="kanban-count is-live bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-black">
            {count}
        </span>
    );
}

export function columnDroppableClass(isDraggingOver: boolean): string {
    return [
        'kanban-column-list flex-1 p-3 space-y-2.5 overflow-y-auto custom-scrollbar',
        isDraggingOver ? 'is-drag-over' : '',
    ]
        .filter(Boolean)
        .join(' ');
}
