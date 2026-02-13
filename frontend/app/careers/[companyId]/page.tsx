'use client';

import { useEffect, useState } from 'react';
import { Briefcase, MapPin, ArrowRight, User, Mail, Phone, FileText, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/useToast';

interface Job {
    id: string;
    title: string;
    department: string;
    description: string;
    requirements: string;
    createdAt: string;
}

export default function CareerPage({ params }: { params: { companyId: string } }) {
    const [data, setData] = useState<{ company: string, logo?: string, jobs: Job[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const toast = useToast();

    useEffect(() => {
        const loadJobs = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/recruitment/public/jobs/${params.companyId}`);
                setData(res.data);
            } catch (error) {
                console.error('Failed to load careers:', error);
            } finally {
                setLoading(false);
            }
        };
        loadJobs();
    }, [params.companyId]);

    const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            await axios.post(`http://localhost:5000/api/recruitment/public/candidates`, {
                companyId: params.companyId,
                jobOpeningId: selectedJob?.id,
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                notes: formData.get('notes'),
                status: 'applied'
            });

            setSubmitted(true);
            toast.success('Application submitted successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to submit application');
        } finally {
            setFormSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900"></div>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
            <Card className="max-w-md w-full p-8 text-center">
                <h1 className="text-xl font-black uppercase text-gray-900">404 - Company Not Found</h1>
                <p className="mt-2 text-xs text-gray-500 font-bold uppercase tracking-widest">
                    This career portal is currently unavailable.
                </p>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Nav / Brand Header */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-3">
                            {data.logo ? (
                                <img
                                    src={data.logo.startsWith('http') ? data.logo : `http://localhost:5000${data.logo}`}
                                    alt={data.company}
                                    className="h-8 w-auto rounded-md"
                                />
                            ) : (
                                <div className="w-8 h-8 bg-primary-900 rounded-md flex items-center justify-center text-white font-black text-xs">
                                    {data.company.charAt(0)}
                                </div>
                            )}
                            <span className="text-sm font-black uppercase tracking-tight text-gray-900">
                                {data.company}
                            </span>
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                            Career Portal
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-primary-900 py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
                        Build the Future of {data.company}
                    </h1>
                    <p className="text-primary-100 text-sm font-medium max-w-2xl mx-auto opacity-80">
                        Join an elite team of innovators and creators. We're looking for passionate individuals
                        ready to make a dent in the universe.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto -mt-8 px-4">
                {!isApplying ? (
                    <div className="grid grid-cols-1 gap-4">
                        {data.jobs.length === 0 ? (
                            <Card className="p-12 text-center">
                                <p className="text-xs font-bold uppercase text-gray-500 tracking-widest">
                                    No Current Openings
                                </p>
                            </Card>
                        ) : (
                            data.jobs.map((job) => (
                                <Card key={job.id} className="group hover:border-primary-600 transition-all duration-300">
                                    <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-black uppercase tracking-widest rounded text-slate-500">
                                                    {job.department}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center group-hover:text-primary-600 transition-colors">
                                                {job.title}
                                            </h3>
                                            <div className="mt-3 flex flex-wrap gap-4 items-center">
                                                <div className="flex items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                    <MapPin size={12} className="mr-1.5 text-primary-600" />
                                                    Remote / Hybrid
                                                </div>
                                                <div className="flex items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                    <Briefcase size={12} className="mr-1.5 text-primary-600" />
                                                    Full-Time
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="primary"
                                            className="w-full md:w-auto text-[10px] font-black"
                                            onClick={() => {
                                                setSelectedJob(job);
                                                setIsApplying(true);
                                                setSubmitted(false);
                                            }}
                                        >
                                            View & Apply <ArrowRight size={14} className="ml-2" />
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Job Details Sidebar */}
                        <div className="lg:col-span-5 space-y-4">
                            <Button
                                variant="secondary"
                                className="text-[10px] font-black uppercase tracking-widest mb-2"
                                onClick={() => setIsApplying(false)}
                            >
                                &larr; Back to Openings
                            </Button>
                            <Card className="p-6">
                                <h2 className="text-lg font-black text-gray-900 uppercase mb-4 leading-none">
                                    {selectedJob?.title}
                                </h2>
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-2">
                                            Role Description
                                        </h4>
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                            {selectedJob?.description}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-2">
                                            Requirements
                                        </h4>
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                            {selectedJob?.requirements || "Standard industry requirements for this role apply."}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Application Form */}
                        <div className="lg:col-span-7">
                            <Card className="p-8">
                                {submitted ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 size={32} className="text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 uppercase mb-2">Application Received!</h3>
                                        <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto mb-8">
                                            Thank you for applying to {data.company}. Our recruitment team will review your profile
                                            and get back to you shortly.
                                        </p>
                                        <Button variant="secondary" onClick={() => setIsApplying(false)}>
                                            Explore Other Roles
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-8">
                                            <h2 className="text-xl font-black text-gray-900 uppercase leading-none mb-2">Quick Application</h2>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                Complete the form below to start your journey.
                                            </p>
                                        </div>

                                        <form onSubmit={handleApply} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] font-black uppercase text-slate-400">First Name</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-3 text-slate-300" size={14} />
                                                        <Input name="firstName" required className="pl-9 text-xs font-bold" placeholder="E.g. John" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] font-black uppercase text-slate-400">Last Name</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-3 text-slate-300" size={14} />
                                                        <Input name="lastName" required className="pl-9 text-xs font-bold" placeholder="E.g. Doe" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] font-black uppercase text-slate-400">Email Address</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3 text-slate-300" size={14} />
                                                    <Input name="email" type="email" required className="pl-9 text-xs font-bold" placeholder="john.doe@example.com" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] font-black uppercase text-slate-400">Phone Number</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-3 text-slate-300" size={14} />
                                                    <Input name="phone" type="tel" required className="pl-9 text-xs font-bold" placeholder="+1 (555) 000-0000" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] font-black uppercase text-slate-400">Brief Note / LinkedIn URL</Label>
                                                <div className="relative">
                                                    <FileText className="absolute left-3 top-3 text-slate-300" size={14} />
                                                    <textarea
                                                        name="notes"
                                                        rows={3}
                                                        className="w-full pl-9 pr-3 py-2.5 text-xs font-bold bg-white border border-gray-200 rounded-md focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-gray-300"
                                                        placeholder="Why are you a great fit?"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-4">
                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    className="w-full h-12 text-[11px] font-black uppercase tracking-widest"
                                                    disabled={formSubmitting}
                                                >
                                                    {formSubmitting ? "Processing..." : "Submit Application"}
                                                </Button>
                                                <p className="mt-4 text-[9px] text-center text-gray-400 font-bold uppercase tracking-wider">
                                                    By submitting, you agree to our recruitment privacy policy.
                                                </p>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            <footer className="max-w-6xl mx-auto px-4 mt-20 border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    &copy; 2026 {data.company}. All rights reserved.
                </div>
                <div className="flex items-center gap-6">
                    <span className="text-[9px] font-black text-primary-900 uppercase tracking-widest">Applizor Enterprise ATS</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest hover:text-primary-600 pointer-events-none opacity-50">Powered by AI</span>
                </div>
            </footer>
        </div>
    );
}
