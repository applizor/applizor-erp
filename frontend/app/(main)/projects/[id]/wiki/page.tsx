'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Edit3, Save, Pin, Clock, Plus } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import RichTextEditor from '@/components/ui/RichTextEditor';

export default function ProjectWiki({ params }: { params: { id: string } }) {
    const toast = useToast();
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeNote, setActiveNote] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [members, setMembers] = useState<any[]>([]);

    // Editor State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchNotes();
        fetchMembers();
    }, [params.id]);

    const fetchMembers = async () => {
        try {
            const res = await api.get(`/projects/${params.id}`);
            if (res.data.members) {
                setMembers(res.data.members.map((m: any) => ({
                    id: m.employee.id,
                    name: `${m.employee.firstName} ${m.employee.lastName}`
                })));
            }
        } catch (error) {
            console.error('Failed to fetch members');
        }
    };

    const fetchNotes = async () => {
        try {
            const res = await api.get(`/projects/${params.id}/notes`);
            setNotes(res.data);
            if (res.data.length > 0 && !activeNote) {
                setActiveNote(res.data[0]);
                setTitle(res.data[0].title);
                setContent(res.data[0].content);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewNote = () => {
        setActiveNote(null);
        setTitle('New Untitled Page');
        setContent('');
        setIsEditing(true);
    };

    const handleSelectNote = (note: any) => {
        setActiveNote(note);
        setTitle(note.title);
        setContent(note.content);
        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (activeNote) {
                // Update
                await api.put(`/projects/notes/${activeNote.id}`, { title, content }); // Fixed route
            } else {
                // Create
                await api.post(`/projects/${params.id}/notes`, { title, content });
            }
            toast.success('Wiki saved');
            await fetchNotes();
            setIsEditing(false);
        } catch (error: any) {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto h-[600px]">
            {/* Sidebar List */}
            <div className="ent-card p-0 flex flex-col border-r border-gray-100 h-full">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Pages</h3>
                    <button onClick={handleNewNote} className="p-1 hover:bg-gray-200 rounded text-gray-600">
                        <Plus size={14} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {notes.length === 0 && (
                        <p className="p-4 text-[10px] text-gray-400 italic">No pages yet.</p>
                    )}
                    {notes.map(note => (
                        <div
                            key={note.id}
                            onClick={() => handleSelectNote(note)}
                            className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${activeNote?.id === note.id ? 'bg-primary-50 border-l-2 border-l-primary-600' : ''}`}
                        >
                            <h4 className={`text-xs font-bold ${activeNote?.id === note.id ? 'text-primary-700' : 'text-gray-900'} truncate`}>{note.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] text-gray-400">{new Date(note.updatedAt).toLocaleDateString()}</span>
                                {note.isPinned && <Pin size={10} className="text-amber-500" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor Area */}
            <div className="md:col-span-3 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        {activeNote ? (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <Clock size={12} /> Last edited {new Date(activeNote.updatedAt).toLocaleString()} by {activeNote.creator?.firstName}
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Drafting New Page...</span>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary flex items-center gap-2"
                    >
                        {saving ? <LoadingSpinner size="sm" /> : <Save size={14} />}
                        Save Changes
                    </button>
                </div>

                <div className="ent-card p-0 flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="bg-gray-50 border-b border-gray-100 p-2 flex gap-2">
                        <button className="p-2 hover:bg-gray-200 rounded text-gray-600"><strong className="font-serif">B</strong></button>
                        <button className="p-2 hover:bg-gray-200 rounded text-gray-600"><em className="font-serif">I</em></button>
                        <button className="p-2 hover:bg-gray-200 rounded text-gray-600"><span className="underline">U</span></button>
                        <div className="w-px h-6 bg-gray-300 mx-2"></div>
                        <input
                            type="text"
                            className="bg-transparent text-sm font-black text-gray-900 placeholder-gray-300 focus:outline-none flex-1"
                            placeholder="PAGE TITLE"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <RichTextEditor
                        value={content}
                        onChange={setContent}
                        mentions={members}
                        className="flex-1 overflow-y-auto"
                        placeholder="Start typing documentation here..."
                    />
                </div>
            </div>
        </div>
    )
}
