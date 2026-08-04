'use client';

import { useEffect, useState } from 'react';
import { Droppable, DroppableProps } from '@hello-pangea/dnd';

/**
 * Droppable wrapper that delays mount until after the first animation frame.
 * Avoids React Strict Mode double-mount issues with @hello-pangea/dnd.
 */
export function StrictModeDroppable({ children, ...props }: DroppableProps) {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    if (!enabled) return null;
    return <Droppable {...props}>{children}</Droppable>;
}
