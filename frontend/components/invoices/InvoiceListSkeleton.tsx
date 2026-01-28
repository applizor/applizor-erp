import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export function InvoiceListSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Stats Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-md border border-slate-100 shadow-sm space-y-3">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-2 w-full" />
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-36" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="ent-table">
                        <thead>
                            <tr>
                                {['Invoice #', 'Client', 'Date', 'Amount', 'Status', 'Actions'].map((header, i) => (
                                    <th key={i} className="px-6 py-4">
                                        <Skeleton className="h-3 w-16" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5, 6].map((row) => (
                                <tr key={row}>
                                    <td className="px-6 py-5"><Skeleton className="h-4 w-24" /></td>
                                    <td className="px-6 py-5"><Skeleton className="h-4 w-32" /></td>
                                    <td className="px-6 py-5"><Skeleton className="h-4 w-20" /></td>
                                    <td className="px-6 py-5"><Skeleton className="h-4 w-24" /></td>
                                    <td className="px-6 py-5"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                    <td className="px-6 py-5"><Skeleton className="h-8 w-10 rounded-md" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
