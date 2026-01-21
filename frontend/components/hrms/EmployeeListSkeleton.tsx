import { Skeleton } from "@/components/ui/Skeleton";

export function EmployeeListSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="ent-card p-4 bg-white border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                        <Skeleton className="h-11 w-11 rounded-lg" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                    <div className="space-y-2 mb-4 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/50">
                        <div className="flex justify-between">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <div className="flex justify-between">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="flex justify-between">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-100">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-4 w-4 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}
