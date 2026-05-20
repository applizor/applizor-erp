'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    BookOpen,
    Award,
    CalendarDays,
    ChevronRight,
    GraduationCap,
    PlayCircle,
    Clock,
    CheckCircle,
    TrendingUp,
    Zap,
} from 'lucide-react';
import api from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface EnrolledCourse {
    id: string;
    courseId: string;
    enrollmentDate: string;
    status: string;
    progress: number;
    grade?: string;
    course: {
        id: string;
        title: string;
        courseCode: string;
        description?: string;
        duration?: string;
        instructor?: {
            firstName: string;
            lastName: string;
        };
    };
}

interface UpcomingClass {
    id: string;
    title: string;
    meetingUrl: string;
    schedule: string;
    course?: {
        title: string;
    };
}

export default function StudentDashboard() {
    const { user } = usePermission();
    const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
    const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudentData();
    }, []);

    const loadStudentData = async () => {
        try {
            const [enrollRes, classRes, certRes] = await Promise.all([
                api.get('/lms/enrollments').catch(() => ({ data: [] })),
                api.get('/lms/classes').catch(() => ({ data: [] })),
                api.get('/certificates').catch(() => ({ data: { certificates: [] } })),
            ]);

            setEnrollments(enrollRes.data || []);

            // Filter upcoming classes (schedule in the future)
            const now = new Date();
            const upcoming = (classRes.data || [])
                .filter((c: UpcomingClass) => new Date(c.schedule) > now)
                .sort((a: UpcomingClass, b: UpcomingClass) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime())
                .slice(0, 5);
            setUpcomingClasses(upcoming);

            setCertificates(certRes.data?.certificates || certRes.data || []);
        } catch (error) {
            console.error('Failed to load student data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    const activeCourses = enrollments.filter(e => e.status === 'active');
    const completedCourses = enrollments.filter(e => e.status === 'completed');
    const avgProgress = activeCourses.length > 0
        ? Math.round(activeCourses.reduce((sum, e) => sum + (e.progress || 0), 0) / activeCourses.length)
        : 0;

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                            Welcome, {user?.firstName}!
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">
                            Your learning journey at a glance.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="ent-card p-4 border-l-4 border-l-primary-600 bg-white shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Courses</p>
                    <h4 className="text-2xl font-black text-slate-900">{activeCourses.length}</h4>
                </div>
                <div className="ent-card p-4 border-l-4 border-l-emerald-500 bg-white shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                    <h4 className="text-2xl font-black text-emerald-600">{completedCourses.length}</h4>
                </div>
                <div className="ent-card p-4 border-l-4 border-l-amber-500 bg-white shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Progress</p>
                    <h4 className="text-2xl font-black text-amber-600">{avgProgress}%</h4>
                </div>
                <div className="ent-card p-4 border-l-4 border-l-violet-500 bg-white shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Certificates</p>
                    <h4 className="text-2xl font-black text-violet-600">{certificates.length}</h4>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* My Courses - Primary */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen size={14} className="text-primary-600" />
                            My Active Courses
                        </h2>
                        <Link href="/lms/courses" className="text-[9px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-800 transition-colors">
                            View All →
                        </Link>
                    </div>

                    {activeCourses.length === 0 ? (
                        <div className="ent-card p-12 text-center">
                            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active courses</p>
                            <p className="text-[10px] text-slate-400 mt-1">Contact your administrator for enrollment.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeCourses.map(enrollment => (
                                <Link
                                    key={enrollment.id}
                                    href={`/lms/courses/${enrollment.courseId}/classroom`}
                                    className="ent-card p-4 bg-white hover:border-primary-200 hover:shadow-lg transition-all block group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary-50 rounded-md group-hover:bg-primary-100 transition-colors flex-shrink-0">
                                            <PlayCircle size={20} className="text-primary-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-[9px] font-black text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                                                    {enrollment.course?.courseCode}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-black text-slate-900 tracking-tight truncate group-hover:text-primary-900 transition-colors">
                                                {enrollment.course?.title}
                                            </h3>
                                            {enrollment.course?.instructor && (
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    Instructor: {enrollment.course.instructor.firstName} {enrollment.course.instructor.lastName}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <div className="text-lg font-black text-primary-600 mb-1">{enrollment.progress || 0}%</div>
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${enrollment.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-200 group-hover:text-primary-600 transition-colors flex-shrink-0" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Completed Courses */}
                    {completedCourses.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <CheckCircle size={14} className="text-emerald-600" />
                                Completed Courses
                            </h2>
                            <div className="space-y-2">
                                {completedCourses.map(enrollment => (
                                    <div
                                        key={enrollment.id}
                                        className="ent-card p-3 bg-emerald-50/30 border-emerald-100 flex items-center gap-3"
                                    >
                                        <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-bold text-slate-900 truncate">{enrollment.course?.title}</h4>
                                        </div>
                                        {enrollment.grade && (
                                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                                Grade: {enrollment.grade}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Upcoming Classes */}
                    <div className="ent-card p-5 bg-white shadow-md border-t-4 border-t-sky-500">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <CalendarDays size={14} className="text-sky-600" />
                                Upcoming Classes
                            </h3>
                        </div>
                        {upcomingClasses.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-[10px] italic">
                                No upcoming classes scheduled.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingClasses.map(cls => (
                                    <a
                                        key={cls.id}
                                        href={cls.meetingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-3 bg-sky-50/50 hover:bg-sky-50 rounded-md transition-colors border border-sky-100/50"
                                    >
                                        <h4 className="text-xs font-bold text-slate-900 mb-1">{cls.title}</h4>
                                        <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                            <Clock size={10} />
                                            <span>{new Date(cls.schedule).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                        <Link
                            href="/lms/classes"
                            className="block w-full text-center mt-4 py-2.5 border-2 border-dashed border-slate-200 text-slate-400 hover:border-sky-400 hover:text-sky-600 font-black uppercase text-[9px] tracking-widest rounded-md transition-all"
                        >
                            View All Classes
                        </Link>
                    </div>

                    {/* Certificates */}
                    <div className="ent-card p-5 bg-slate-900 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Award size={14} className="text-amber-400" />
                            My Certificates
                        </h3>
                        {certificates.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-xs text-slate-500 italic">Complete courses to earn certificates.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {certificates.slice(0, 3).map((cert: any) => (
                                    <div
                                        key={cert.id}
                                        className="p-3 bg-slate-800/50 rounded-md border border-slate-700/50"
                                    >
                                        <h4 className="text-[11px] font-bold text-white truncate">{cert.title || cert.courseName}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                                                {cert.status}
                                            </span>
                                            {cert.grade && (
                                                <span className="text-[8px] font-black text-amber-400">
                                                    Grade: {cert.grade}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link
                            href="/hrms/certificates"
                            className="block w-full text-center mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[9px] tracking-widest rounded-md transition-all"
                        >
                            View All Certificates
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
