/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps, @next/next/no-img-element */
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface Project {
    id: string;
    name: string;
    description: string | null;
    _count: { audits: number; monitoredSites: number; };
    createdAt: string;
}

export default function ProjectsPage() {
    const { data: session } = useSession();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (session) fetchProjects();
    }, [session]);

    const fetchProjects = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects`, {
                headers: { 'Authorization': `Bearer ${(session as any)?.accessToken}` }
            });
            const data = await res.json();
            if (!data.error) setProjects(data);
        } catch {} finally { setLoading(false); }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(session as any)?.accessToken}` },
                body: JSON.stringify({ name: newName, description: newDesc })
            });
            const data = await res.json();
            if (res.ok) {
                setProjects([data, ...projects]);
                setIsCreateModalOpen(false);
                setNewName('');
                setNewDesc('');
            } else { alert(`Error: ${data.error}`); }
        } catch { alert('Failed to create project.'); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects/${confirmDeleteId}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${(session as any)?.accessToken}` }
            });
            if (res.ok) {
                setProjects(projects.filter(p => p.id !== confirmDeleteId));
                setConfirmDeleteId(null);
            }
        } catch { alert('Failed to delete project.'); }
        finally { setIsDeleting(false); }
    };

    // Pastel project avatar colors
    const avatarColors = [
        'from-emerald-500 to-teal-600',
        'from-blue-500 to-indigo-600',
        'from-purple-500 to-violet-600',
        'from-orange-500 to-amber-600',
        'from-pink-500 to-rose-600',
        'from-cyan-500 to-sky-600',
    ];

    return (
        <div className="min-h-screen bg-[#050B14] text-white selection:bg-emerald-500/30">
            <Navbar />

            {/* BG */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-500/[0.03] rounded-full blur-[130px]"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '64px 64px' }}></div>
            </div>

            <main className="relative z-10 max-w-6xl mx-auto pt-24 px-6 pb-20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Organization</p>
                        <h1 className="text-3xl font-black tracking-tight">
                            SEO <span className="text-slate-500">Projects</span>
                        </h1>
                        <p className="text-slate-600 text-sm mt-1.5">Group audits and monitoring by client or domain.</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm px-5 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] flex-shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        New Project
                    </button>
                </div>

                {/* Projects */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-slate-900/20 border border-white/[0.04] rounded-2xl animate-pulse" />)}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="bg-slate-900/30 border border-white/[0.04] border-dashed rounded-3xl p-16 text-center">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-800">
                            <svg className="w-7 h-7 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-black mb-2">No projects yet</h2>
                        <p className="text-slate-600 text-sm mb-6 max-w-xs mx-auto">Create a project to start organizing your SEO workspace by client or domain.</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="text-emerald-400 hover:text-emerald-300 text-xs font-black uppercase tracking-widest transition-colors"
                        >
                            + Create First Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {projects.map((project, i) => (
                            <div key={project.id} className="group bg-slate-900/50 border border-white/[0.05] rounded-2xl p-5 hover:border-emerald-500/25 hover:bg-slate-900/80 transition-all flex flex-col relative">
                                {/* Delete on hover */}
                                <button
                                    onClick={() => setConfirmDeleteId(project.id)}
                                    className="absolute top-4 right-4 p-1.5 text-slate-700 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>

                                {/* Avatar + name */}
                                <div className="flex items-start gap-3 mb-4 pr-8">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                                        {project.name[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-black truncate group-hover:text-emerald-300 transition-colors">{project.name}</h3>
                                        <p className="text-[10px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                                            {project.description || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2 mt-auto mb-4">
                                    <div className="bg-slate-950/60 border border-white/[0.04] rounded-xl p-3">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Audits</p>
                                        <p className="text-xl font-black">{project?._count?.audits || 0}</p>
                                    </div>
                                    <div className="bg-slate-950/60 border border-white/[0.04] rounded-xl p-3">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Monitored</p>
                                        <p className="text-xl font-black">{project?._count?.monitoredSites || 0}</p>
                                    </div>
                                </div>

                                {/* Footer link */}
                                <Link
                                    href={`/projects/${project.id}`}
                                    className="flex items-center justify-between pt-3 border-t border-white/[0.05] text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-emerald-400 transition-colors"
                                >
                                    <span>Open Workspace</span>
                                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-5 right-5 p-1.5 text-slate-600 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="mb-6">
                            <h3 className="text-xl font-black mb-1">New Project</h3>
                            <p className="text-slate-500 text-sm">Create a workspace to organize audits by client or domain.</p>
                        </div>

                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Project Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Client Alpha"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder-slate-700"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Description <span className="text-slate-700 normal-case font-medium">(optional)</span></label>
                                <textarea
                                    placeholder="Project goals or client details..."
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder-slate-700 h-24 resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 text-sm"
                            >
                                {isSubmitting ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                                ) : 'Create Project'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirm Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden text-white">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10 flex flex-col items-center text-center gap-5">
                            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400">
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white mb-1">Delete Project?</h3>
                                <p className="text-slate-500 text-sm">All associated audit data will be moved to unorganized. This cannot be undone.</p>
                            </div>
                            <div className="flex gap-3 w-full font-bold text-sm uppercase tracking-widest">
                                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors">Abort</button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
