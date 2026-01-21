import React from 'react';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={`shimmer rounded-md ${className}`} />
    );
}

export function TableRowSkeleton({ columns = 5, rows = 1 }: { columns?: number; rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, r) => (
                <tr key={r} className="animate-pulse">
                    {Array.from({ length: columns }).map((_, i) => (
                        <td key={i} className="px-6 py-4">
                            <Skeleton className={`h-4 ${i === 0 ? 'w-32' : 'w-24'}`} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export function CardSkeleton() {
    return (
        <div className="ent-card p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
            </div>
        </div>
    );
}
