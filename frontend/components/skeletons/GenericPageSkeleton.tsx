'use client';

import React from 'react';

export default function GenericPageSkeleton() {
    return (
        <div className="animate-fade-in p-6">
            <div className="h-8 w-1/3 shimmer rounded-md mb-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-md shadow-sm border border-slate-100 h-40 shimmer" />
                ))}
            </div>

            <div className="bg-white p-6 rounded-md shadow-sm border border-slate-100">
                <div className="h-6 w-full shimmer rounded-md mb-4" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <div className="h-4 w-1/4 shimmer rounded" />
                            <div className="h-4 w-1/2 shimmer rounded" />
                            <div className="h-4 w-1/4 shimmer rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
