'use client';

import { Award, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { certificateApi, certificateTemplateApi, CertificateTemplate } from '@/lib/api/certificate';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: { name: string };
    position?: { title: string };
}

interface Candidate {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export default function NewCertificatePage() {
    const router = useRouter();
    const toast = useToast();
    const { can, user } = usePermission();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Dropdown options
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [templates, setTemplates] = useState<CertificateTemplate[]>([]);

    // Form state
    const [type, setType] = useState<'course' | 'internship' | 'experience' | 'custom'>('course');
    const [recipientType, setRecipientType] = useState<'employee' | 'candidate'>('employee');
    const [employeeId, setEmployeeId] = useState('');
    const [candidateId, setCandidateId] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [title, setTitle] = useState('');
    const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0]);
    const [expiryDate, setExpiryDate] = useState('');
    const [remarks, setRemarks] = useState('');

    // Course fields
    const [courseName, setCourseName] = useState('');
    const [duration, setDuration] = useState('');
    const [grade, setGrade] = useState('');
    const [score, setScore] = useState('');

    // Internship fields
    const [internshipRole, setInternshipRole] = useState('');
    const [guideName, setGuideName] = useState('');
    const [projectName, setProjectName] = useState('');

    // Experience fields
    const [department, setDepartment] = useState('');
    const [designation, setDesignation] = useState('');

    // Custom fields json editor (simplistic key-value entries)
    const [customKeyValue, setCustomKeyValue] = useState<{ key: string; value: string }[]>([
        { key: '', value: '' }
    ]);

    useEffect(() => {
        if (user) {
            loadFormOptions();
        }
    }, [user, type, recipientType]);

    const loadFormOptions = async () => {
        try {
            setLoading(true);
            const promises: Promise<any>[] = [
                certificateTemplateApi.list({ type, isActive: true }),
            ];

            if (recipientType === 'employee') {
                promises.push(api.get('/employees'));
            } else {
                promises.push(api.get('/recruitment/candidates'));
            }

            const [templatesRes, recipientsRes] = await Promise.all(promises);

            setTemplates(templatesRes.data);
            if (recipientType === 'employee') {
                setEmployees(recipientsRes.data);
                setCandidates([]);
            } else {
                setCandidates(recipientsRes.data.data || recipientsRes.data); // handles paginated format
                setEmployees([]);
            }
        } catch (error: any) {
            toast.error('Failed to load form lookup data');
        } finally {
            setLoading(false);
        }
    };

    // Auto fill fields on employee select (e.g. designation & dept for experience letter)
    const handleEmployeeChange = (empId: string) => {
        setEmployeeId(empId);
        if (type === 'experience' && empId) {
            const selectedEmp = employees.find(e => e.id === empId);
            if (selectedEmp) {
                setDepartment(selectedEmp.department?.name || '');
                setDesignation(selectedEmp.position?.title || '');
            }
        }
    };

    // Set default titles when type/template changes
    useEffect(() => {
        if (type === 'course') {
            setTitle('Course Completion Certificate');
        } else if (type === 'internship') {
            setTitle('Certificate of Internship');
        } else if (type === 'experience') {
            setTitle('Experience Letter');
        } else {
            setTitle('Custom Certificate');
        }
    }, [type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (recipientType === 'employee' && !employeeId) {
            toast.error('Please select an employee');
            return;
        }
        if (recipientType === 'candidate' && !candidateId) {
            toast.error('Please select a candidate');
            return;
        }

        // Format custom fields JSON
        const customFields: Record<string, string> = {};
        customKeyValue.forEach(item => {
            if (item.key.trim() && item.value.trim()) {
                customFields[item.key.trim()] = item.value.trim();
            }
        });

        try {
            setSaving(true);
            await certificateApi.create({
                type,
                recipientType,
                employeeId: recipientType === 'employee' ? employeeId : undefined,
                candidateId: recipientType === 'candidate' ? candidateId : undefined,
                templateId: templateId || undefined,
                title,
                issuedDate,
                expiryDate: expiryDate || undefined,
                courseName: type === 'course' ? courseName : undefined,
                duration: ['course', 'internship'].includes(type) ? duration : undefined,
                grade: type === 'course' ? grade : undefined,
                score: type === 'course' ? score : undefined,
                internshipRole: type === 'internship' ? internshipRole : undefined,
                guideName: type === 'internship' ? guideName : undefined,
                projectName: type === 'internship' ? projectName : undefined,
                department: type === 'experience' ? department : undefined,
                designation: type === 'experience' ? designation : undefined,
                customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
                remarks: remarks || undefined,
            });

            toast.success('Certificate created successfully');
            router.push('/hrms/certificates');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create certificate');
        } finally {
            setSaving(false);
        }
    };

    if (user && !can('Certificate', 'create')) {
        return <AccessDenied />;
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Create Certificate"
                subtitle="Issue a new official credential or document"
                icon={Award}
                actions={
                    <Link href="/hrms/certificates" className="ent-button-secondary flex items-center gap-2">
                        <ArrowLeft size={14} /> Back to Ledger
                    </Link>
                }
            />

            {loading ? (
                <div className="flex justify-center items-center py-16 bg-white rounded-md border border-gray-200 shadow-sm">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6 max-w-4xl mx-auto w-full">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="ent-label">Certificate Type</label>
                                <CustomSelect
                                    value={type}
                                    onChange={(val: any) => setType(val)}
                                    options={[
                                        { label: 'Course Certificate', value: 'course' },
                                        { label: 'Internship Certificate', value: 'internship' },
                                        { label: 'Experience Letter', value: 'experience' },
                                        { label: 'Custom Document', value: 'custom' }
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="ent-label">Branding Template</label>
                                <CustomSelect
                                    value={templateId}
                                    onChange={(val) => setTemplateId(val)}
                                    options={[
                                        { label: '-- Use Default Design --', value: '' },
                                        ...templates.map(t => ({ label: t.name, value: t.id }))
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                            <div>
                                <label className="ent-label">Recipient Category</label>
                                <CustomSelect
                                    value={recipientType}
                                    onChange={(val: any) => setRecipientType(val)}
                                    options={[
                                        { label: 'Active Employee', value: 'employee' },
                                        { label: 'Recruitment Candidate / Intern', value: 'candidate' }
                                    ]}
                                />
                            </div>

                            <div>
                                {recipientType === 'employee' ? (
                                    <>
                                        <label className="ent-label">Recipient Employee *</label>
                                        <CustomSelect
                                            value={employeeId}
                                            onChange={handleEmployeeChange}
                                            options={[
                                                { label: '-- Select Employee --', value: '' },
                                                ...employees.map(emp => ({
                                                    label: `${emp.firstName} ${emp.lastName} (${emp.employeeId})`,
                                                    value: emp.id
                                                }))
                                            ]}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label className="ent-label">Recipient Candidate / Intern *</label>
                                        <CustomSelect
                                            value={candidateId}
                                            onChange={(val) => setCandidateId(val)}
                                            options={[
                                                { label: '-- Select Candidate --', value: '' },
                                                ...candidates.map(cand => ({
                                                    label: `${cand.firstName} ${cand.lastName} (${cand.email})`,
                                                    value: cand.id
                                                }))
                                            ]}
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                            <div className="md:col-span-2">
                                <label className="ent-label">Document Title / Display Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="ent-input w-full"
                                    placeholder="e.g. Certificate of Achievement in React"
                                />
                            </div>
                            <div>
                                <label className="ent-label">Issue Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={issuedDate}
                                    onChange={(e) => setIssuedDate(e.target.value)}
                                    className="ent-input w-full"
                                />
                            </div>
                        </div>

                        {/* Course Fields */}
                        {type === 'course' && (
                            <div className="bg-slate-50/50 p-4 rounded-md border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="ent-label text-primary-900">Course Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={courseName}
                                        onChange={(e) => setCourseName(e.target.value)}
                                        className="ent-input w-full bg-white"
                                        placeholder="e.g. Full Stack Development Bootcamp"
                                    />
                                </div>
                                <div>
                                    <label className="ent-label text-primary-900">Duration</label>
                                    <input
                                        type="text"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="ent-input w-full bg-white"
                                        placeholder="e.g. 6 Months"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="ent-label text-primary-900">Grade</label>
                                        <input
                                            type="text"
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value)}
                                            className="ent-input w-full bg-white"
                                            placeholder="e.g. A+ / Distinction"
                                        />
                                    </div>
                                    <div>
                                        <label className="ent-label text-primary-900">Score / Percentage</label>
                                        <input
                                            type="text"
                                            value={score}
                                            onChange={(e) => setScore(e.target.value)}
                                            className="ent-input w-full bg-white"
                                            placeholder="e.g. 92%"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Internship Fields */}
                        {type === 'internship' && (
                            <div className="bg-slate-50/50 p-4 rounded-md border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="ent-label text-primary-900">Internship Designation / Role *</label>
                                    <input
                                        type="text"
                                        required
                                        value={internshipRole}
                                        onChange={(e) => setInternshipRole(e.target.value)}
                                        className="ent-input w-full bg-white"
                                        placeholder="e.g. Software Engineer Intern"
                                    />
                                </div>
                                <div>
                                    <label className="ent-label text-primary-900">Assigned Project Name</label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="ent-input w-full bg-white"
                                        placeholder="e.g. Internal Inventory App"
                                    />
                                </div>
                                <div>
                                    <label className="ent-label text-primary-900">Guide / Mentor Name</label>
                                    <input
                                        type="text"
                                        value={guideName}
                                        onChange={(e) => setGuideName(e.target.value)}
                                        className="ent-input w-full bg-white"
                                        placeholder="e.g. Ravi Sharma (VP Engineering)"
                                    />
                                </div>
                                <div>
                                    <label className="ent-label text-primary-900">Duration</label>
                                    <input
                                        type="text"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="ent-input w-full bg-white"
                                        placeholder="e.g. 3 Months"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Experience Letter Fields */}
                        {type === 'experience' && (
                            <div className="bg-slate-50/50 p-4 rounded-md border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="ent-label text-primary-900">Department</label>
                                    <input
                                        type="text"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="ent-input w-full bg-white"
                                        placeholder="e.g. Technology"
                                    />
                                </div>
                                <div>
                                    <label className="ent-label text-primary-900">Designation / Role</label>
                                    <input
                                        type="text"
                                        value={designation}
                                        onChange={(e) => setDesignation(e.target.value)}
                                        className="ent-input w-full bg-white"
                                        placeholder="e.g. Senior Frontend Developer"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Custom / Additional Variables section */}
                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="ent-label">Custom Template Placeholders (Key-Value)</label>
                                <button
                                    type="button"
                                    onClick={() => setCustomKeyValue([...customKeyValue, { key: '', value: '' }])}
                                    className="text-[10px] text-primary-600 font-bold uppercase tracking-wider hover:underline"
                                >
                                    + Add Variable
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mb-3">
                                Provide any extra template parameters that will replace matchings like `{"{{key}}"}` in your custom HTML template.
                            </p>
                            <div className="space-y-2">
                                {customKeyValue.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Placeholder (e.g. project_score)"
                                            value={item.key}
                                            onChange={(e) => {
                                                const list = [...customKeyValue];
                                                list[idx].key = e.target.value;
                                                setCustomKeyValue(list);
                                            }}
                                            className="ent-input flex-1 text-xs"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Replacement value"
                                            value={item.value}
                                            onChange={(e) => {
                                                const list = [...customKeyValue];
                                                list[idx].value = e.target.value;
                                                setCustomKeyValue(list);
                                            }}
                                            className="ent-input flex-1 text-xs"
                                        />
                                        {customKeyValue.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setCustomKeyValue(customKeyValue.filter((_, i) => i !== idx))}
                                                className="text-red-500 hover:text-red-700 text-xs p-1"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4">
                            <div>
                                <label className="ent-label">Remarks / Internal Notes</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={2}
                                    className="ent-input w-full"
                                    placeholder="Add any internal reference or notes regarding this certification issue..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
                            <Link href="/hrms/certificates" className="ent-button-secondary py-2 px-4">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary py-2 px-5 flex items-center gap-2"
                            >
                                {saving ? <LoadingSpinner /> : <Save size={14} />} Save Draft
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
