import React from 'react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

export function LeadListSkeleton() {
    return (
        <div className="ent-card overflow-hidden animate-pulse">
            <div className="overflow-x-auto">
                <table className="ent-table">
                    <thead>
                        <tr>
                            {['Prospect Identity', 'Contact Protocol', 'Corporate Entity', 'Pipeline Stage', 'Origin', 'Valuation', 'Action Protocol'].map((header, i) => (
                                <th key={i}>
                                    <div className="h-3 bg-gray-200 rounded w-16 opacity-50"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <TableRowSkeleton columns={7} rows={6} />
                    </tbody>
                </table>
            </div>
        </div>
    );
}
