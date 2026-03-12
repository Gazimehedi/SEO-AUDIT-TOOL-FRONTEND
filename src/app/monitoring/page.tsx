'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

interface MonitoredSite {
    id: string;
    url: string;
    interval: 'daily' | 'weekly';
    lastScore: number | null;
    previousScore: number | null;
    lastAuditedAt: string | null;
    createdAt: string;
}

export default function MonitoringPage() {
    const { data: session } = useSession();
    const [sites, setSites] = useState<MonitoredSite[]>([]);
    const [loading, setLoading] = useState(true);
    const [newUrl, setNewUrl] = useState('');
    const [newInterval, setNewInterval] = useState<'daily' | 'weekly'>('weekly');
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (session) {
            fetchSites();
            fetch('http://localhost:5000/api/projects', {
                headers: { 'Authorization': `Bearer ${(session as any)?.accessToken}` }
            }).then(r => r.json()).then(d => { if (!d.error) setProjects(d); });
        }
    }, [session]);

    const fetchSites = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/monitoring', {
                headers: { 'Authorization': `Bearer ${(session as any)?.accessToken}` }
            });
            const data = await res.json();
            if (!data.error) setSites(data);
        } catch {} finally { setLoading(false); }
    };

    const handleAddSite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/api/monitoring', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(session as any)?.accessToken}` },
                body: JSON.stringify({ url: newUrl, interval: newInterval, projectId: selectedProjectId || undefined })
            });
            const data = await res.json();
            if (res.ok) {
                setSites([data.site, ...sites]);
                setNewUrl('');
            } else { alert(`Error: ${data.error}`); }
        } catch { alert('Failed to add site.'); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Stop monitoring this site?')) return;
        const res = await fetch(`http://localhost:5000/api/monitoring/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${(session as any)?.accessToken}` }
        });
        if (res.ok) setSites(sites.filter(s => s.id !== id));
    };

    const handleIntervalChange = async (id: string, interval: 'daily' | 'weekly') => {
        const res = await fetch(`http://localhost:5000/api/monitoring/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(session as any)?.accessToken}` },
            body: JSON.stringify({ interval })
        });
        if (res.ok) setSites(sites.map(s => s.id === id ? { ...s, interval } : s));
    };

    const scoreColor = (s: number | null) => !s ? 'text-slate-600' : s >= 90 ? 'text-teal-400' : s >= 70 ? 'text-amber-400' : 'text-rose-400';

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-teal-500/30 font-sans">
            <Navbar />

            {/* Immersive Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(15,23,42,1)_0%,rgba(2,6,23,1)_100%)]"></div>
                <div className="absolute top-0 right-0 w-[1000px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-teal-500/[0.02] rounded-full blur-[140px]"></div>
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            </div>

            <main className="relative z-10 pt-24 px-6 lg:px-12 pb-20 max-w-[1700px] mx-auto">
                
                {/* Control Tower Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
                    <div className="space-y-2">
                        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                            <span>Infrastructure</span>
                            <span className="text-slate-800">/</span>
                            <span className="text-teal-500">Telemetry Node Array</span>
                        </nav>
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white flex items-center gap-4">
                            Operational <span className="text-slate-600">Center</span>
                        </h1>
                    </div>
                    
                    <div className="flex gap-12 self-start md:self-auto px-4">
                         <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Network Nodes</div>
                            <div className="text-3xl font-black tabular-nums">{sites.length}</div>
                        </div>
                        <div className="space-y-1 text-teal-400">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/40">Critical Health</div>
                            <div className="text-3xl font-black tabular-nums">{sites.filter(s => (s.lastScore || 0) >= 90).length}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-10 items-start">
                    
                    {/* Left Panel: Primary Configuration Hub (PERFECTLY BALANCED) */}
                    <div className="w-full xl:w-[340px] flex-shrink-0 xl:sticky xl:top-32">
                        <div className="relative group/form">
                            {/* Glass Panel Decor */}
                            <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-[2rem] pointer-events-none"></div>
                            
                            <div className="relative bg-[#0F172A]/60 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
                                
                                {/* Ambient Glow Inside Card */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/[0.03] rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2"></div>
                                
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-white flex items-center justify-between mb-8 pl-1">
                                    <span className="flex items-center gap-2.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(45,212,191,0.8)]"></span>
                                        PROVISION NODE
                                    </span>
                                    <svg className="w-3.5 h-3.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </h3>

                                <form onSubmit={handleAddSite} className="space-y-5 relative z-10">
                                    {/* URL Input */}
                                    <div className="space-y-2 group/input">
                                        <div className="flex justify-between items-center pl-1">
                                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Domain Endpoint</label>
                                            <span className="text-[8px] font-mono text-slate-800">SECURE_SYNC</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="url"
                                                placeholder="https://example.com"
                                                required
                                                value={newUrl}
                                                onChange={(e) => setNewUrl(e.target.value)}
                                                className="w-full bg-[#020617]/40 border border-white/5 rounded-xl px-4 py-3.5 text-[11px] font-medium text-white placeholder-slate-800 focus:outline-none focus:border-teal-500/30 transition-all shadow-inner"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interval Select */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 pl-1">Audit Cadence</label>
                                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#020617]/60 rounded-xl border border-white/5">
                                            {(['daily', 'weekly'] as const).map(int => (
                                                <button
                                                    key={int}
                                                    type="button"
                                                    onClick={() => setNewInterval(int)}
                                                    className={`py-2.5 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] transition-all duration-300 ${
                                                        newInterval === int 
                                                        ? 'bg-teal-500 text-[#020617] shadow-lg shadow-teal-500/10' 
                                                        : 'text-slate-600 hover:text-slate-300'
                                                    }`}
                                                >
                                                    {int}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Workspace Select */}
                                    {projects.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 pl-1">Logical Workspace</label>
                                            <div className="relative group/select">
                                                <select
                                                    value={selectedProjectId}
                                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                                    className="w-full bg-[#020617]/40 border border-white/5 rounded-xl px-4 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 focus:outline-none focus:border-teal-500/30 focus:text-teal-400 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="">Ungrouped Nodes</option>
                                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-700">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full relative overflow-hidden bg-white text-black font-black py-3.5 rounded-xl text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-teal-400 hover:shadow-[0_15px_30px_-10px_rgba(45,212,191,0.3)] active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'INIT...' : 'DEPLOY SENSOR'}
                                        </button>
                                        <p className="text-center text-[7px] font-bold text-slate-700 uppercase tracking-widest mt-4 italic">Node-ID Auto-Generated // SSL Enabled</p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Metric Resource Grid */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-6 mb-8">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 italic flex-shrink-0">Active Telemetry Array</h2>
                            <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent"></div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white/[0.02] border border-white/5 rounded-[2.5rem] animate-pulse"></div>)}
                            </div>
                        ) : sites.length === 0 ? (
                            <div className="h-[600px] border border-dashed border-white/5 rounded-[3rem] bg-white/[0.01] flex flex-col items-center justify-center text-center px-10">
                                <div className="w-20 h-20 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-center mb-8">
                                    <svg className="w-10 h-10 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-black text-white italic mb-4 tracking-tighter">Nodes Offline.</h2>
                                <p className="text-slate-600 max-w-sm font-medium leading-relaxed uppercase text-[9px] tracking-widest">Connect your first asset to the monitoring array.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {sites.map((site) => {
                                    const hostname = (() => { try { return new URL(site.url).hostname; } catch { return site.url; } })();
                                    const scoreDiff = site.previousScore !== null && site.lastScore !== null ? site.lastScore - site.previousScore : 0;
                                    const isOptimal = (site.lastScore || 0) >= 90;
                                    const isUnstable = (site.lastScore || 0) < 70 && site.lastScore !== null;

                                    return (
                                        <div key={site.id} className="group relative">
                                            {/* Action Float */}
                                            <div className="absolute top-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-1 group-hover:translate-y-0">
                                                <button 
                                                    onClick={() => handleDelete(site.id)}
                                                    className="w-9 h-9 bg-rose-500 rounded-xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all outline-none shadow-lg"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="h-full bg-slate-900/10 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 lg:p-9 transition-all duration-700 hover:bg-[#0F172A]/40 hover:border-white/10 flex flex-col items-start relative overflow-hidden">
                                                
                                                <div className="w-full flex justify-between items-center mb-8">
                                                    <div className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.3em] font-mono border ${isOptimal ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : isUnstable ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-slate-500'}`}>
                                                        {site.lastScore === null ? 'PROVISIONING' : isOptimal ? 'OPTIMAL' : isUnstable ? 'UNSTABLE' : 'STABLE'}
                                                    </div>
                                                    <div className="text-[9px] font-black text-slate-700 font-mono tracking-widest">{site.id.slice(0, 6).toUpperCase()}</div>
                                                </div>

                                                <div className="mb-10 w-full">
                                                    <h3 className="text-3xl font-black text-white truncate max-w-[90%] tracking-tighter mb-1.5 italic" title={site.url}>
                                                        {hostname.split('.')[0]}
                                                    </h3>
                                                    <div className="inline-flex items-center gap-2 text-[9px] font-bold text-slate-500 truncate uppercase tracking-[0.05em] bg-slate-950/40 px-2.5 py-1 rounded-lg border border-white/[0.03]">
                                                        <svg className="w-3 h-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                        </svg>
                                                        {site.url}
                                                    </div>
                                                </div>

                                                <div className="w-full mt-auto">
                                                    <div className="flex items-end justify-between gap-6">
                                                        <div className="space-y-1.5">
                                                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Health Metric</div>
                                                            <div className="flex items-baseline gap-3">
                                                                <span className={`text-6xl font-black tracking-tighter tabular-nums leading-none ${scoreColor(site.lastScore)}`}>
                                                                    {site.lastScore ?? '--'}
                                                                </span>
                                                                {scoreDiff !== 0 && (
                                                                    <div className={`flex items-center gap-0.5 text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${scoreDiff > 0 ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} mb-1`}>
                                                                         <svg className={`w-3 h-3 ${scoreDiff > 0 ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 15l7-7 7 7" />
                                                                        </svg>
                                                                        {Math.abs(scoreDiff)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Sparkline Decorative */}
                                                        <div className="flex-1 max-w-[120px] h-12 opacity-10 group-hover:opacity-30 transition-opacity duration-1000">
                                                            <svg viewBox="0 0 100 40" className="w-full h-full">
                                                                <path 
                                                                    d="M0,35 Q10,10 20,30 T40,20 T60,25 T80,15 L100,30" 
                                                                    fill="none" 
                                                                    stroke={isOptimal ? '#2DD4BF' : '#F43F5E'} 
                                                                    strokeWidth="2.5" 
                                                                    strokeLinecap="round"
                                                                />
                                                            </svg>
                                                        </div>
                                                    </div>

                                                    <div className="mt-10 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                                                            <span className="text-[9px] font-mono text-slate-700 tracking-[0.2em]">{site.lastAuditedAt ? new Date(site.lastAuditedAt).toLocaleDateString().replace(/\//g, '.') : 'INIT_PENDING'}</span>
                                                        </div>
                                                        
                                                        <div className="relative group/select">
                                                            <select
                                                                value={site.interval}
                                                                onChange={(e) => handleIntervalChange(site.id, e.target.value as 'daily' | 'weekly')}
                                                                className="bg-transparent text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] appearance-none pr-5 focus:outline-none focus:text-teal-400 cursor-pointer transition-colors"
                                                            >
                                                                <option value="daily" className="bg-[#0A121E]">Daily</option>
                                                                <option value="weekly" className="bg-[#0A121E]">Weekly</option>
                                                            </select>
                                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-hover/select:translate-y-px transition-transform duration-300">
                                                                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
