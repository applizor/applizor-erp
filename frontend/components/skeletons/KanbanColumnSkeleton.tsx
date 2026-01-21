import { Skeleton } from "@/components/ui/Skeleton";

export function KanbanColumnSkeleton() {
    return (
        <div className="flex gap-6 overflow-x-auto pb-12 px-2 snap-x hide-scrollbar">
            {[1, 2, 3, 4, 5].map((col) => (
                <div key={col} className="flex flex-col min-w-[300px] max-w-[300px] snap-center">
                    <div className="mb-4 px-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded shadow-lg" />
                            <div>
                                <Skeleton className="h-4 w-24 mb-1" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 rounded-md p-3 min-h-[600px] bg-gray-50/30 border border-gray-100 space-y-4">
                        {[1, 2, 3].map(card => (
                            <div key={card} className="ent-card p-4 space-y-3">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                                <div className="flex justify-between pt-2 border-t border-gray-50">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-12" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
