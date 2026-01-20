'use client';

export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {children}
        </div>
    );
}
