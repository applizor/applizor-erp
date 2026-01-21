import React from 'react';

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
                        {[1, 2, 3, 4, 5, 6].map((row) => (
                            <tr key={row}>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-200 rounded opacity-60"></div>
                                        <div className="space-y-2">
                                            <div className="h-3 bg-gray-200 rounded w-32 opacity-70"></div>
                                            <div className="h-2 bg-gray-200 rounded w-20 opacity-40"></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="space-y-2">
                                        <div className="h-2.5 bg-gray-200 rounded w-24 opacity-60"></div>
                                        <div className="h-2 bg-gray-200 rounded w-20 opacity-40"></div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="h-3 bg-gray-200 rounded w-24 opacity-50"></div>
                                </td>
                                <td className="p-4">
                                    <div className="h-5 bg-gray-100 rounded-full w-20 opacity-80"></div>
                                </td>
                                <td className="p-4">
                                    <div className="h-2.5 bg-gray-200 rounded w-16 opacity-50"></div>
                                </td>
                                <td className="p-4">
                                    <div className="h-3 bg-gray-300 rounded w-20 opacity-60"></div>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-end gap-2">
                                        <div className="w-7 h-7 bg-gray-100 rounded opacity-50"></div>
                                        <div className="w-7 h-7 bg-gray-100 rounded opacity-50"></div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
