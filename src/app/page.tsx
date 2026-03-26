/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps, @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';

export default function Home() {
    const [url, setUrl] = useState('');
    const [targetKeyword, setTargetKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        document.title = 'SEO Pro — Ultimate SEO Checker';
        if (session && (session as any).accessToken) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects`, {
                headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
            })
            .then(res => res.json())
            .then(data => { if (!data.error) setProjects(data); })
            .catch(err => console.error('Failed to fetch projects:', err));
        }
    }, [session]);

    const handleAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        if (session && !(session as any).accessToken) {
            alert('Your login session has expired. Please log out and log back in.');
            return;
        }

        setLoading(true);
        try {
            const headers: any = { 'Content-Type': 'application/json' };
            if ((session as any)?.accessToken) {
                headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/audit/start`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ url, targetKeyword, projectId: selectedProjectId || undefined })
            });
            const data = await res.json();

            if (data.error) {
                alert(data.error);
                setLoading(false);
            } else {
                router.push(`/audit/${data.jobId}`);
            }
        } catch (err) {
            alert('Failed to connect to backend.');
            setLoading(false);
        }
    };

    const features = [
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            label: 'Core Web Vitals',
            desc: 'LCP, CLS, and full performance scoring',
            color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        },
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
            label: 'Meta & OG Tags',
            desc: 'Title, description, Open Graph audit',
            color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        },
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            ),
            label: 'Broken Links',
            desc: '404s and redirect chains site-wide',
            color: 'text-red-400 bg-red-500/10 border-red-500/20',
        },
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            label: 'Security Headers',
            desc: 'CSP, HSTS, X-Frame score check',
            color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        },
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            ),
            label: 'AI Insights',
            desc: 'GPT-powered fix recommendations',
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        },
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            label: 'PDF Reports',
            desc: 'Branded, shareable audit exports',
            color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        },
    ];

    return (
        <main className="min-h-screen bg-[#050B14] text-white overflow-hidden selection:bg-emerald-500/30">
            <Navbar />

            {/* Background atmospheric layers */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/[0.05] rounded-full blur-[140px]"></div>
                <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-blue-500/[0.04] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/[0.03] rounded-full blur-[100px]"></div>
                {/* Grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '64px 64px' }}></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto pt-24 px-6 pb-12">

                {/* Hero */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        AI-Powered · Full-Site BFS Crawl · Export Reports
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.08] mb-3">
                        <span className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                            The Ultimate
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                            SEO Auditor
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                        Drop any URL and get a deep technical report in seconds — performance, meta, security, links, and more.
                    </p>
                </div>

                {/* Audit Form Card */}
                <form onSubmit={handleAudit} className="relative bg-slate-900/60 border border-white/[0.06] rounded-3xl p-5 backdrop-blur-xl shadow-2xl shadow-black/50 mb-4">
                    {/* Corner glow */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/[0.07] rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>

                    <div className="relative z-10 space-y-3">
                        {/* URL input — primary, full-width */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Website URL</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                </div>
                                <input
                                    type="url"
                                    placeholder="https://yourwebsite.com"
                                    required
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-slate-800 outline-none text-base px-5 py-3 pl-12 rounded-2xl text-white placeholder-slate-700 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Secondary row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Target Keyword <span className="text-slate-700 normal-case font-medium">(optional)</span></label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="e.g. pizza delivery"
                                        value={targetKeyword}
                                        onChange={(e) => setTargetKeyword(e.target.value)}
                                        className="w-full bg-slate-950/80 border border-slate-800 outline-none text-sm px-4 py-3 pl-10 rounded-2xl text-white placeholder-slate-700 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Project <span className="text-slate-700 normal-case font-medium">(optional)</span></label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                    </div>
                                    <select
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                        className="w-full bg-slate-950/80 border border-slate-800 outline-none text-sm px-4 py-3 pl-10 rounded-2xl text-slate-300 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">No Project</option>
                                        {projects.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative w-full group overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base py-4 rounded-2xl transition-all duration-300 shadow-[0_8px_32px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.45)] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                            {loading ? (
                                <span className="flex items-center gap-3 justify-center">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                    </svg>
                                    Starting Audit...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 justify-center">
                                    Run Full SEO Audit
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                            )}
                        </button>

                        {/* Trust badges */}
                        <div className="flex items-center justify-center gap-8">
                            {['Full BFS Crawl', 'AI Insights', 'PDF Export'].map(badge => (
                                <span key={badge} className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                    </svg>
                                    {badge}
                                </span>
                            ))}
                        </div>
                    </div>
                </form>

                {/* View history link */}
                <div className="flex justify-center mb-20">
                    <button
                        onClick={() => router.push('/history')}
                        className="text-slate-600 hover:text-slate-400 text-sm font-medium flex items-center gap-2 transition-colors group"
                    >
                        <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        View Audit History
                    </button>
                </div>

                {/* Features Grid */}
                <div>
                    <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-700 mb-8">What's included in every audit</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {features.map((f) => (
                            <div key={f.label} className="bg-slate-900/40 border border-white/[0.04] p-5 rounded-2xl hover:border-white/10 hover:bg-slate-900/60 transition-all group">
                                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border mb-4 ${f.color}`}>
                                    {f.icon}
                                </div>
                                <h3 className="text-sm font-black text-white mb-1">{f.label}</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
