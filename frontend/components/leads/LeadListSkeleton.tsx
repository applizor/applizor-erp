import React from 'react';

export function LeadListSkeleton() {
    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg animate-pulse">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Name', 'Contact', 'Company', 'Status', 'Priority', 'Source', 'Value', 'Actions'].map((header, i) => (
                                <th key={i} className="px-6 py-3 text-left">
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {[1, 2, 3, 4, 5].map((row) => (
                            <tr key={row}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                                        <div className="ml-4">
                                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
