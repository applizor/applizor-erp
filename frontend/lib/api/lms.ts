import api from '@/lib/api';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Student {
    id: string;
    companyId: string;
    userId?: string;
    studentId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
    user?: {
        isActive: boolean;
    };
    enrollments?: CourseEnrollment[];
}

export interface Course {
    id: string;
    companyId: string;
    code: string;
    title: string;
    description?: string;
    instructorId?: string;
    duration?: string;
    syllabus?: any;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
    instructor?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    enrollments?: CourseEnrollment[];
}

export interface CourseEnrollment {
    id: string;
    companyId: string;
    studentId: string;
    courseId: string;
    enrollmentDate: string;
    status: 'active' | 'completed' | 'dropped';
    progress?: number;
    grade?: string;
    score?: string;
    certificateIssued?: boolean;
    createdAt: string;
    updatedAt: string;
    student?: Student;
    course?: Course;
}

export interface OnlineClass {
    id: string;
    companyId: string;
    courseId: string;
    title: string;
    description?: string;
    meetingLink: string;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
    course?: Course;
}

export interface StudentListResponse {
    data: Student[];
}

// ─── Mapping Utilities ────────────────────────────────────────────────────────

export const mapCourse = (raw: any): Course => {
    if (!raw) return raw;
    const isAct = raw.isActive !== undefined ? raw.isActive : true;
    return {
        ...raw,
        code: raw.code || raw.courseCode || '',
        status: raw.status || (isAct ? 'active' : 'inactive')
    };
};

export const mapCoursePayload = (data: Partial<Course>): any => {
    const payload: any = { ...data };
    if (data.code !== undefined) {
        payload.courseCode = data.code;
        delete payload.code;
    }
    if (data.status !== undefined) {
        payload.isActive = data.status === 'active';
        delete payload.status;
    }
    return payload;
};

export const mapOnlineClass = (raw: any): OnlineClass => {
    if (!raw) return raw;
    const startTime = raw.startTime || raw.schedule || '';
    const endTime = raw.endTime || (startTime ? new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString() : '');
    return {
        ...raw,
        meetingLink: raw.meetingLink || raw.meetingUrl || '',
        startTime,
        endTime,
        course: raw.course ? mapCourse(raw.course) : undefined
    };
};

export const mapOnlineClassPayload = (data: Partial<OnlineClass>): any => {
    const payload: any = { ...data };
    if (data.meetingLink !== undefined) {
        payload.meetingUrl = data.meetingLink;
        delete payload.meetingLink;
    }
    if (data.startTime !== undefined) {
        payload.schedule = data.startTime;
        delete payload.startTime;
    }
    delete payload.endTime;
    return payload;
};

export const mapEnrollment = (raw: any): CourseEnrollment => {
    if (!raw) return raw;
    return {
        ...raw,
        course: raw.course ? mapCourse(raw.course) : undefined,
        student: raw.student ? mapStudent(raw.student) : undefined
    };
};

export const mapStudent = (raw: any): Student => {
    if (!raw) return raw;
    return {
        ...raw,
        enrollments: raw.enrollments ? raw.enrollments.map(mapEnrollment) : undefined
    };
};

// ─── API Clients ─────────────────────────────────────────────────────────────

export const studentApi = {
    list: (params?: { search?: string }) =>
        api.get<Student[]>('/lms/students', { params }).then(res => ({
            ...res,
            data: (res.data || []).map(mapStudent)
        })),

    get: (id: string) =>
        api.get<Student>(`/lms/students/${id}`).then(res => ({
            ...res,
            data: mapStudent(res.data)
        })),

    create: (data: Partial<Student> & { password?: string; employeeId?: string }) =>
        api.post<Student>('/lms/students', data).then(res => ({
            ...res,
            data: mapStudent(res.data)
        })),

    update: (id: string, data: Partial<Student> & { password?: string; portalActive?: boolean; createAccount?: boolean; roleId?: string }) =>
        api.put<Student>(`/lms/students/${id}`, data).then(res => ({
            ...res,
            data: mapStudent(res.data)
        })),

    delete: (id: string) =>
        api.delete(`/lms/students/${id}`),
};

export const courseApi = {
    list: (params?: { search?: string }) =>
        api.get<Course[]>('/lms/courses', { params }).then(res => ({
            ...res,
            data: (res.data || []).map(mapCourse)
        })),

    get: (id: string) =>
        api.get<Course>(`/lms/courses/${id}`).then(res => ({
            ...res,
            data: mapCourse(res.data)
        })),

    create: (data: Partial<Course>) =>
        api.post<Course>('/lms/courses', mapCoursePayload(data)).then(res => ({
            ...res,
            data: mapCourse(res.data)
        })),

    update: (id: string, data: Partial<Course>) =>
        api.put<Course>(`/lms/courses/${id}`, mapCoursePayload(data)).then(res => ({
            ...res,
            data: mapCourse(res.data)
        })),

    delete: (id: string) =>
        api.delete(`/lms/courses/${id}`),
};

export const enrollmentApi = {
    list: (params?: { studentId?: string; courseId?: string }) =>
        api.get<CourseEnrollment[]>('/lms/enrollments', { params }).then(res => ({
            ...res,
            data: (res.data || []).map(mapEnrollment)
        })),

    get: (id: string) =>
        api.get<CourseEnrollment>(`/lms/enrollments/${id}`).then(res => ({
            ...res,
            data: mapEnrollment(res.data)
        })),

    create: (data: Partial<CourseEnrollment>) =>
        api.post<CourseEnrollment>('/lms/enrollments', data).then(res => ({
            ...res,
            data: mapEnrollment(res.data)
        })),

    update: (id: string, data: Partial<CourseEnrollment>) =>
        api.put<CourseEnrollment>(`/lms/enrollments/${id}`, data).then(res => ({
            ...res,
            data: mapEnrollment(res.data)
        })),

    delete: (id: string) =>
        api.delete(`/lms/enrollments/${id}`),
};

export const onlineClassApi = {
    list: (params?: { courseId?: string }) =>
        api.get<OnlineClass[]>('/lms/classes', { params }).then(res => ({
            ...res,
            data: (res.data || []).map(mapOnlineClass)
        })),

    get: (id: string) =>
        api.get<OnlineClass>(`/lms/classes/${id}`).then(res => ({
            ...res,
            data: mapOnlineClass(res.data)
        })),

    create: (data: Partial<OnlineClass>) =>
        api.post<OnlineClass>('/lms/classes', mapOnlineClassPayload(data)).then(res => ({
            ...res,
            data: mapOnlineClass(res.data)
        })),

    update: (id: string, data: Partial<OnlineClass>) =>
        api.put<OnlineClass>(`/lms/classes/${id}`, mapOnlineClassPayload(data)).then(res => ({
            ...res,
            data: mapOnlineClass(res.data)
        })),

    delete: (id: string) =>
        api.delete(`/lms/classes/${id}`),
};

// ─── Lectures & Exams ─────────────────────────────────────────────────────────

export interface Lecture {
    id: string;
    companyId: string;
    courseId: string;
    title: string;
    description?: string;
    videoUrl?: string;
    content?: string;
    order: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    completed?: boolean;
}

export interface ExamQuestion {
    id?: string;
    examId?: string;
    questionText: string;
    options: string[];
    correctOption: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ExamSubmission {
    id: string;
    studentId: string;
    examId: string;
    score: number;
    passed: boolean;
    answers: Record<string, number>;
    createdAt: string;
}

export interface Exam {
    id: string;
    companyId: string;
    courseId: string;
    title: string;
    description?: string;
    passingScore: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    questions?: ExamQuestion[];
    submissions?: ExamSubmission[];
    _count?: {
        questions: number;
    };
}

export const lectureApi = {
    listByCourse: (courseId: string) =>
        api.get<Lecture[]>(`/lms/lectures/course/${courseId}`),
    
    create: (data: Partial<Lecture>) =>
        api.post<Lecture>('/lms/lectures', data),

    update: (id: string, data: Partial<Lecture>) =>
        api.put<Lecture>(`/lms/lectures/${id}`, data),

    delete: (id: string) =>
        api.delete(`/lms/lectures/${id}`),

    complete: (id: string, completed?: boolean) =>
        api.post<{ success: boolean; progress: number; completed: boolean }>(`/lms/lectures/${id}/complete`, { completed }),
};

export const examApi = {
    listByCourse: (courseId: string) =>
        api.get<Exam[]>(`/lms/exams/course/${courseId}`),

    get: (id: string) =>
        api.get<Exam>(`/lms/exams/${id}`),

    create: (data: Partial<Exam> & { questions?: ExamQuestion[] }) =>
        api.post<Exam>('/lms/exams', data),

    update: (id: string, data: Partial<Exam> & { questions?: ExamQuestion[] }) =>
        api.put<Exam>(`/lms/exams/${id}`, data),

    delete: (id: string) =>
        api.delete(`/lms/exams/${id}`),

    submit: (id: string, answers: Record<string, number>) =>
        api.post<{
            submission: ExamSubmission;
            correctCount: number;
            totalQuestions: number;
            scorePercentage: number;
            passed: boolean;
            certificateCreated: boolean;
            certificateId: string | null;
        }>(`/lms/exams/${id}/submit`, { answers }),
};

