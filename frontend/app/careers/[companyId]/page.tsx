'use client';

import { useEffect, useState } from 'react';
import { Briefcase, MapPin, ArrowRight } from 'lucide-react';
import axios from 'axios';

interface Job {
    id: string;
    title: string;
    department: string;
    description: string;
    createdAt: string;
}

export default function CareerPage({ params }: { params: { companyId: string } }) {
    const [data, setData] = useState<{ company: string, jobs: Job[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadJobs = async () => {
            try {
                // Using generic axios here as api.ts likely has auth interceptors
                const res = await axios.get(`http://localhost:4000/api/recruitment/public/jobs/${params.companyId}`);
                setData(res.data);
            } catch (error) {
                console.error('Failed to load careers:', error);
            } finally {
                setLoading(false);
            }
        };
        loadJobs();
    }, [params.companyId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Opportunities...</div>;
    if (!data) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Company not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{data.company} Careers</h1>
                    <p className="mt-2 text-lg text-gray-500">Join our team and help us build the future.</p>
                </div>
            </div>

            {/* Job List */}
            <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">
                    {data.jobs.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                            <p className="text-gray-500">No open positions at the moment. Please check back later.</p>
                        </div>
                    ) : (
                        data.jobs.map((job) => (
                            <div key={job.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100">
                                <div className="p-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                            <span className="flex items-center">
                                                <Briefcase size={16} className="mr-1.5" />
                                                {job.department}
                                            </span>
                                            <span className="flex items-center">
                                                <MapPin size={16} className="mr-1.5" />
                                                Remote / Hybrid
                                            </span>
                                        </div>
                                        <p className="text-gray-600 line-clamp-2">{job.description}</p>
                                    </div>
                                    <div className="mt-4 sm:mt-0 sm:ml-6">
                                        <button className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
                                            Apply Now
                                            <ArrowRight size={16} className="ml-2" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-white mt-12">
                <div className="max-w-5xl mx-auto py-8 px-4 text-center text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} {data.company}. All rights reserved. Powered by Applizor.
                </div>
            </div>
        </div>
    );
}
