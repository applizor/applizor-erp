import React from 'react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

export function ClientListSkeleton() {
    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg animate-pulse">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Name / Company', 'Contact', 'Location', 'Type', 'Status', 'Actions'].map((header, i) => (
                                <th key={i} className="px-6 py-3 text-left">
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <TableRowSkeleton columns={6} rows={5} />
                    </tbody>
                </table>
            </div>
        </div>
    );
}
