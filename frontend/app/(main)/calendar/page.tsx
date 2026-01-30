'use client';

import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { holidaysApi } from '@/lib/api/attendance';
import { CalendarDays, Filter } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

// Setup the localizer
const localizer = momentLocalizer(moment);

export default function CalendarPage() {
    const toast = useToast();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('month');

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            // Fetch Holidays
            const holidays = await holidaysApi.getAll();

            const calendarEvents = [
                ...holidays.map((h: any) => ({
                    id: `holiday-${h.id}`,
                    title: `Holiday: ${h.name}`,
                    start: new Date(h.date),
                    end: new Date(h.date),
                    allDay: true,
                    resource: 'holiday',
                    color: '#10B981' // Emerald
                })),
                // Mock Project Deadlines for now as projectApi fetch needs logic
                {
                    id: 'proj-1',
                    title: 'PROJECT: CRM Launch',
                    start: new Date(new Date().setDate(15)),
                    end: new Date(new Date().setDate(15)),
                    allDay: true,
                    resource: 'project',
                    color: '#3B82F6' // Blue
                }
            ];

            setEvents(calendarEvents);
        } catch (error) {
            console.error('Failed to load calendar:', error);
            toast.error('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    const eventStyleGetter = (event: any) => {
        return {
            style: {
                backgroundColor: event.color,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
            }
        };
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <CalendarDays className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Unified Schedule</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest">
                            Corporate Events & Deliverable Timeline
                        </p>
                    </div>
                </div>
            </div>

            <div className="ent-card flex-1 p-6 bg-white overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center flex-1">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%', minHeight: 500 }}
                        eventPropGetter={eventStyleGetter}
                        views={['month', 'week', 'day', 'agenda']}
                        defaultView="month"
                        className="ent-calendar text-xs font-bold"
                    />
                )}
            </div>

            <style jsx global>{`
                .rbc-calendar { font-family: inherit; }
                .rbc-header { padding: 10px 0; font-weight: 900; text-transform: uppercase; font-size: 10px; color: #64748b; }
                .rbc-month-view { border-radius: 8px; border: 1px solid #e2e8f0; }
                .rbc-today { background-color: #f8fafc; }
                .rbc-off-range-bg { background-color: #f1f5f9; }
            `}</style>
        </div>
    );
}
