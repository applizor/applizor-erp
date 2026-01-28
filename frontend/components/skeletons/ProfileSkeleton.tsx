import { Skeleton } from "@/components/ui/Skeleton";

export function ProfileSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
            {/* Cover & Avatar */}
            <div className="relative mb-16">
                <Skeleton className="h-48 w-full rounded-md" />
                <div className="absolute -bottom-12 left-8">
                    <Skeleton className="h-32 w-32 rounded-full border-4 border-white" />
                </div>
            </div>

            {/* Header Info */}
            <div className="pt-2 pl-8 space-y-2 mb-8">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
            </div>

            {/* Content Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div className="ent-card p-4 space-y-4">
                        <Skeleton className="h-5 w-32" />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <div className="ent-card p-6 space-y-6">
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-40" />
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                            <Skeleton className="h-10 w-32 ml-auto" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
