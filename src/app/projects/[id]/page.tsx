/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps, @next/next/no-img-element */
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
    ChevronLeft, 
    BarChart2, 
    Activity, 
    Clock, 
    Globe, 
    ExternalLink,
    AlertCircle,
    Layout
} from 'lucide-react';
import Link from 'next/link';

interface ProjectDetail {
    id: string;
    name: string;
    description: string | null;
    audits: any[];
    monitoredSites: any[];
    createdAt: string;
}

export default function ProjectDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session && id) {
            fetchProjectDetails();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, id]);

    const fetchProjectDetails = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects/${id}`, {
                headers: {
                    'Authorization': `Bearer ${(session as any)?.accessToken}`
                }
            });
            const data = await res.json();
            if (!data.error) setProject(data);
            else alert(data.error);
        } catch (err) {
            console.error('Failed to fetch project:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
                <div>
                    <h1 className="text-3xl font-black mb-4">Project Not Found</h1>
                    <button onClick={() => router.push('/projects')} className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Return to projects</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30">
            <Navbar />
            
            <main className="max-w-7xl mx-auto pt-32 px-6 pb-20">
                <Link href="/projects" className="flex items-center gap-2 text-slate-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest mb-8">
                    <ChevronLeft className="w-4 h-4" /> Back to Projects
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <Layout className="w-4 h-4 text-emerald-400" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Project Workspace</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase italic">{project.name}</h1>
                        <p className="text-slate-500 mt-2 font-medium max-w-2xl">{project.description || 'Dedicated workspace for SEO tracking and analysis.'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Audits Section */}
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <BarChart2 className="w-6 h-6 text-blue-400" /> Recent Audits
                            </h2>
                            <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                {project.audits.length} Total
                             </span>
                        </div>

                        {project.audits.length === 0 ? (
                            <div className="bg-slate-900/20 border border-white/5 border-dashed rounded-[2rem] p-12 text-center text-slate-600 font-bold italic">
                                No audits recorded in this project yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {project.audits.slice(0, 10).map((audit: { id: string; url: string; score: number; createdAt: string }) => (
                                    <Link 
                                        key={audit.id} 
                                        href={`/audit/${audit.id}`}
                                        className="block bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:bg-slate-900 hover:border-blue-500/20 transition-all flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${audit.score >= 90 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                {audit.score || '--'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm truncate max-w-[200px]">{new URL(audit.url).hostname}</div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{new Date(audit.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-slate-700 group-hover:text-blue-400 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Monitored Sites Section */}
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <Activity className="w-6 h-6 text-emerald-400" /> Tracked URLs
                            </h2>
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                {project.monitoredSites.length} Active
                             </span>
                        </div>

                        {project.monitoredSites.length === 0 ? (
                            <div className="bg-slate-900/20 border border-white/5 border-dashed rounded-[2rem] p-12 text-center text-slate-600 font-bold italic">
                                No sites are being monitored in this project.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {project.monitoredSites.map((site: any) => (
                                    <div 
                                        key={site.id} 
                                        className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex flex-col gap-4 group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Globe className="w-4 h-4 text-slate-500" />
                                                <span className="font-bold text-sm tracking-tight">{new URL(site.url).hostname}</span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Every {site.interval}</span>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex-1">
                                                <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Health Score</div>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-2xl font-black tracking-tighter">{site.lastScore ?? '--'}</span>
                                                    {site.previousScore && site.lastScore && (
                                                        <span className={`text-[10px] font-black mb-1 ${site.lastScore >= site.previousScore ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {site.lastScore >= site.previousScore ? '↑' : '↓'} {Math.abs(site.lastScore - site.previousScore)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Last Sync</div>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                    <span className="text-[10px] font-black uppercase text-slate-400">
                                                        {site.lastAuditedAt ? new Date(site.lastAuditedAt).toLocaleDateString() : 'Never'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <Link 
                            href="/monitoring"
                            className="mt-8 block w-full bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                        >
                            Configure Monitoring Settings
                        </Link>
                    </section>
                </div>
            </main>
        </div>
    );
}
