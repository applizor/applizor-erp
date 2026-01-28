import React from 'react';

export function QuotationListSkeleton() {
    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg animate-pulse">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Quotation #', 'Lead/Client', 'Date', 'Valid Until', 'Total', 'Status', 'Actions'].map((header, i) => (
                                <th key={i} className="px-6 py-3 text-left">
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {[1, 2, 3, 4, 5].map((row) => (
                            <tr key={row}>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
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
