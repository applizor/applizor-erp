'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function PortalProjects() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/portal/projects')
            .then((res: any) => setProjects(res.data))
            .catch((err: any) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading projects...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">My Projects</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.length === 0 ? (
                    <div className="text-gray-500 col-span-full">No active projects found</div>
                ) : (
                    projects.map((project) => (
                        <div key={project.id} className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">{project.name}</h3>
                                <div className="mt-2 text-sm text-gray-500">
                                    {project.description || 'No description provided.'}
                                </div>
                                <div className="mt-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${project.status === 'active' ? 'bg-green-100 text-green-800' :
                                        project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {project.status}
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <div className="text-xs text-gray-500">Timeline</div>
                                    <div className="text-sm font-semibold">
                                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} -
                                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
