/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps, @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { io } from 'socket.io-client';
import IssueCard from '@/components/IssueCard';
import AuditScore from '@/components/AuditScore';
import ChatAssistant from '@/components/ChatAssistant';
import Navbar from '@/components/Navbar';
import { Zap, FileJson, FileSpreadsheet, FileText } from 'lucide-react';

const activityTicker = [
    "Initializing deep scan engine...",
    "Analyzing meta tag distribution...",
    "Checking H1/H2 heading hierarchy...",
    "Validating canonical URL consistency...",
    "Scanning for broken internal links...",
    "Inspecting robots.txt permissions...",
    "Verifying Open Graph social metadata...",
    "Measuring content-to-code ratios...",
    "Detecting JSON-LD structured data...",
    "Checking image alt text accessibility..."
];

export default function AuditResults({ params }: { params: { jobId: string } }) {
    const { data: session } = useSession();
    const [data, setData] = useState<any>(null);
    const [loadingMsg, setLoadingMsg] = useState('Initializing Audit...');
    const [progress, setProgress] = useState(0);
    const [displayProgress, setDisplayProgress] = useState(0);
    const [tickerIndex, setTickerIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<string>('initializing');
    const [selectedCategory, setSelectedCategory] = useState<string>('Overview');
    const [aiSummary, setAiSummary] = useState<any>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const router = useRouter();
    const [isPrintMode, setIsPrintMode] = useState(false);
    const { jobId } = params;

    // Keep browser tab title in sync
    useEffect(() => {
        document.title = data
            ? `Audit: ${data.results?.title || data.url} — SEO Pro`
            : 'Auditing… — SEO Pro';
    }, [data]);

    // Smooth progress animation
    useEffect(() => {
        if (data || error) return;
        const interval = setInterval(() => {
            setDisplayProgress(prev => {
                if (prev < progress) return Math.min(progress, prev + 1);
                if (prev < 98) return prev + 0.1;
                return prev;
            });
        }, 300);
        return () => clearInterval(interval);
    }, [progress, data, error]);

    // Activity Ticker intervals
    useEffect(() => {
        if (data || error) return; 
        const interval = setInterval(() => {
            setTickerIndex(prev => (prev + 1) % activityTicker.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [data, error]);

    useEffect(() => {
        const isPrint = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === 'true';
        setIsPrintMode(isPrint);
        
        const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}`, {
            transports: ['polling', 'websocket']
        });

        socket.emit('join-job', jobId);

        // Initial state fetch
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/audit/${jobId}`)
            .then(res => res.json())
            .then(job => {
                if (job.status === 'complete') {
                    setData(job);
                    if (job.aiSummary) setAiSummary(job.aiSummary);
                } else if (job.status === 'failed') {
                    setError(job.error || 'Audit engine connection lost');
                } else if (job.progress) {
                    const initProgress = Math.round((job.progress.crawled / (job.progress.total || 15)) * 100);
                    setProgress(initProgress);
                    setDisplayProgress(initProgress);
                }
            })
            .catch(() => setError('Failed to connect to audit engine'));

        socket.on(`job-${jobId}-progress`, (msg) => {
            setLoadingMsg(msg.text || `Crawling pages... (${msg.crawled})`);
            const calculatedProgress = Math.round((msg.crawled / 15) * 100);
            setProgress(Math.max(10, Math.min(98, calculatedProgress))); 
        });

        socket.on(`job-${jobId}-step`, (msg) => {
            if (msg.step) setCurrentStep(msg.step);
        });

        socket.on(`job-${jobId}-complete`, () => {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/audit/${jobId}`)
                .then(res => res.json())
                .then(job => {
                    setData(job);
                    if (job.aiSummary) setAiSummary(job.aiSummary);
                });
        });

        socket.on(`job-${jobId}-failed`, (err) => {
            setError(err.error || 'Audit failed inexplicably');
        });

        return () => { socket.disconnect(); };
    }, [jobId]);

    const generateAIInsights = async (force = false) => {
        setIsGeneratingAI(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ai/analyze/${jobId}${force ? '?force=true' : ''}`, {
                method: 'POST'
            });
            const result = await res.json();
            if (res.ok) setAiSummary(result);
            else alert(`AI Generation failed: ${result.error}`);
        } catch (err) {
            alert('A network error occurred generating AI summary.');
        } finally { setIsGeneratingAI(false); }
    };

    const handleDownload = async (url: string, filename: string, id: string) => {
        if (downloading) return;
        setDownloading(id);
        const token = (session as any)?.accessToken;
        try {
            const res = await fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => { window.URL.revokeObjectURL(downloadUrl); link.remove(); }, 100);
        } catch (err) { alert('Failed to download report.'); } finally { setDownloading(null); }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-8 border border-red-500/20">
                    <Zap className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-black text-white mb-4">Audit Failed</h1>
                <p className="text-slate-400 text-lg mb-8 max-w-md">{error}</p>
                <button onClick={() => router.push('/')} className="bg-white text-black font-black py-4 px-10 rounded-2xl transition-all hover:bg-slate-200">
                    RETURN TO DASHBOARD
                </button>
            </div>
        );
    }

    if (!data) {
        const steps = [
            { id: 'initializing', label: 'Initializing', sub: 'Spinning up engine', icon: <Zap className="w-6 h-6" /> },
            { id: 'crawling', label: 'Crawling', sub: 'Deep scan analysis', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg> },
            { id: 'finalizing', label: 'Finalizing', sub: 'Building report', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        ];
        const currentIndex = Math.max(0, steps.findIndex(s => s.id === currentStep));

        return (
            <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[100px]"></div>
                    <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '48px 48px' }}></div>
                </div>

                <div className="max-w-2xl w-full relative z-10">
                    <div className="text-center mb-14">
                        <div className="relative inline-flex items-center justify-center mb-8">
                            <div className="absolute w-28 h-28 rounded-full bg-emerald-500/10 animate-[ping_2s_ease-in-out_infinite]"></div>
                            <div className="absolute w-20 h-20 rounded-full border border-emerald-500/20 animate-[spin_8s_linear_infinite]"><div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400"></div></div>
                            <div className="relative w-16 h-16 bg-slate-900 border border-slate-700/80 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight mb-3">
                            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-blue-400 bg-clip-text text-transparent">Auditing in Progress</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Deep-scanning your website for SEO issues & opportunities</p>
                    </div>

                    <div className="relative mb-10 px-2 flex justify-between">
                         {/* Track line (background) */}
                         <div className="absolute top-9 left-[12%] right-[12%] h-px bg-slate-800"></div>
                        {/* Track line (active fill) */}
                        <div className="absolute top-9 left-[12%] h-px bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-1000 ease-in-out" style={{ width: `calc(${(currentIndex / 2) * 76}%)` }}></div>

                        {steps.map((step, index) => (
                            <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                                <div className={`relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center transition-all duration-700 ${index === currentIndex ? 'bg-slate-900 border-2 border-emerald-500 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.35)] scale-110' : index < currentIndex ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 scale-100' : 'bg-slate-900/80 border border-slate-800 text-slate-600 scale-95 opacity-40'}`}>
                                    {index === currentIndex && <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/40 animate-ping"></div>}
                                    {index < currentIndex ? <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg> : step.icon}
                                </div>
                                <div className="text-center">
                                    <div className={`text-[11px] font-black uppercase tracking-[0.12em] transition-colors duration-500 ${index === currentIndex ? 'text-white' : index < currentIndex ? 'text-emerald-500' : 'text-slate-700'}`}>{step.label}</div>
                                    <div className={`text-[10px] mt-0.5 transition-colors duration-500 ${index === currentIndex ? 'text-emerald-400/70' : index < currentIndex ? 'text-slate-600' : 'text-slate-800'}`}>{index === currentIndex ? '' : step.sub}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mb-8 h-10 flex items-center justify-center">
                        <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-5 py-2.5 rounded-full backdrop-blur-sm shadow-xl animate-in slide-in-from-bottom-2 duration-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span className="text-[10px] text-slate-400 font-mono tracking-tight">
                                {loadingMsg.includes('https') ? `Processing: ${loadingMsg.split(' ').pop()}` : activityTicker[tickerIndex]}
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-600">Overall Progress</span>
                            <span className={`text-xs font-black px-3 py-1 rounded-full border transition-all duration-700 ${displayProgress > 60 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'text-blue-400 bg-blue-500/10 border-blue-500/30'}`}>{Math.floor(displayProgress)}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800/50 p-0.5">
                            <div className="bg-gradient-to-r from-emerald-600 via-teal-400 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${Math.max(displayProgress, 2)}%` }}></div>
                        </div>
                        <div className="flex justify-between mt-3 text-[9px] text-slate-700 font-bold uppercase tracking-widest">
                            <p>Est. scan time: {Math.max(1, Math.round((100 - displayProgress) * 0.4))}s remaining</p>
                            <p>Limit: 15 Pages</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const { results, score } = data;
    const { issues = [] } = results || {};
    const categories = Array.from(new Set(['Overview', 'Competitors', (Object.keys(results?.pageMetadata || {}).length > 0 ? 'Keyword Intelligence' : ''), ...issues.map((i: any) => i.category)].filter(Boolean))) as string[];
    const filteredIssues = selectedCategory === 'Overview' ? issues : issues.filter((i: any) => i.category === selectedCategory);
    const isSpecialTab = ['Competitors', 'Keyword Intelligence'].includes(selectedCategory);

    return (
        <main className="min-h-screen bg-slate-950 text-white pb-20">
            {!isPrintMode && <Navbar />}
            <div className={`max-w-7xl mx-auto px-6 ${isPrintMode ? 'pt-0' : 'pt-32'}`}>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 relative">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-400">Audit Node Online</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-3 truncate max-w-2xl">{data.url.replace(/^https?:\/\//, '')}</h1>
                        <p className="text-slate-500 text-sm font-medium flex items-center gap-2"><span className="w-4 h-[1px] bg-slate-800"></span> Generated {new Date(data.createdAt).toLocaleDateString()} at {new Date(data.createdAt).toLocaleTimeString()}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                         <button onClick={() => handleDownload(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/audit/${jobId}/pdf`, `Report-${jobId}.pdf`, 'pdf')} disabled={!!downloading} className="bg-white/5 hover:bg-white/10 text-white pr-5 pl-4 py-3 rounded-xl border border-white/5 flex items-center gap-2 text-xs font-bold uppercase">{downloading === 'pdf' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileText className="w-4 h-4" />} PDF REPORT</button>
                         <button onClick={() => handleDownload(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/audit/${jobId}/pdf?type=advanced`, `Premium-${jobId}.pdf`, 'pdf-adv')} disabled={!!downloading} className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 pr-5 pl-4 py-3 rounded-xl border border-blue-500/20 flex items-center gap-2 text-xs font-bold uppercase">{downloading === 'pdf-adv' ? <div className="w-4 h-4 border-2 border-blue-400 border-t-blue-400 rounded-full animate-spin" /> : <Zap className="w-4 h-4" />} PREMIUM</button>
                         <button onClick={() => handleDownload(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/audit/${jobId}/export?format=csv`, `Data-${jobId}.csv`, 'csv')} disabled={!!downloading} className="bg-white/5 hover:bg-white/10 text-white pr-5 pl-4 py-3 rounded-xl border border-white/5 flex items-center gap-2 text-xs font-bold uppercase">{downloading === 'csv' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} CSV</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start mb-20">
                    <div className="lg:col-span-1"><AuditScore score={Math.round(score || 0)} label="SEO Health" /></div>
                    <div className="lg:col-span-3 h-full">
                        <div className="bg-slate-900/40 border border-white/[0.05] rounded-[32px] p-8 h-full flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20"><Zap className="w-5 h-5" /></div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">AI Intelligence <span className="text-slate-600">Report</span></h3>
                                </div>
                                {!aiSummary ? (
                                    <div className="space-y-4">
                                        <p className="text-slate-400 text-sm leading-relaxed max-w-xl">Deep-dive into your SEO performance with neural-engine insights, prioritized fixes, and strategy gaps.</p>
                                        <button onClick={() => generateAIInsights()} disabled={isGeneratingAI} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-3 text-xs uppercase tracking-widest">{isGeneratingAI ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />} Generate AI Insights</button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5"><p className="text-slate-300 leading-relaxed text-sm">{aiSummary.executiveSummary}</p></div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div><h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Top Priorities</h4><ul className="space-y-1">{aiSummary.topPriorities?.map((p: string, i: number) => (<li key={i} className="text-xs text-slate-400">• {p}</li>))}</ul></div>
                                            <div><h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Quick Wins</h4><ul className="space-y-1">{aiSummary.quickWins?.map((w: string, i: number) => (<li key={i} className="text-xs text-slate-400">• {w}</li>))}</ul></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative mb-12">
                    <div className="flex flex-wrap gap-2 bg-slate-900/40 p-2 rounded-[24px] border border-white/5">
                        {categories.map((cat: string) => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-emerald-500 text-white shadow-[0_10px_20px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:text-white'}`}>{cat}</button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4">
                    {selectedCategory === 'Competitors' ? (
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                            <h3 className="text-xl font-bold mb-6">Benchmark vs Competitors</h3>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const url = (e.currentTarget.elements.namedItem('u') as HTMLInputElement).value;
                                try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/competitors/compare/${jobId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ competitorUrl: url }) });
                                    if (res.ok) { alert('Benchmark started!'); e.currentTarget.reset(); }
                                } catch (err) { alert('Failed to start.'); }
                            }} className="flex gap-4">
                                <input name="u" type="url" placeholder="https://competitor.com" className="flex-1 bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm" required />
                                <button type="submit" className="bg-white text-black font-black px-6 py-3 rounded-xl text-sm">ADD SITE</button>
                            </form>
                        </div>
                    ) : selectedCategory === 'Keyword Intelligence' ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                             <h3 className="text-xl font-bold mb-6">Top 20 Keywords</h3>
                             <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
                                {Object.values(results.pageMetadata || {}).flatMap((m: any) => m.keywords || []).reduce((acc: any[], c: any) => {
                                    const e = acc.find(x => x.word === c.word);
                                    if (e) { e.count += c.count; e.density = Math.round((e.density + c.density) / 2 * 100) / 100; }
                                    else acc.push({...c}); return acc;
                                }, []).sort((a,b) => b.count - a.count).slice(0, 20).map((k: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 py-2 border-b border-white/5">
                                        <div className="w-32 truncate font-bold text-slate-300 text-xs uppercase">{k.word}</div>
                                        <div className="flex-1 bg-slate-950 h-1.5 rounded-full overflow-hidden"><div className={`h-full ${k.density > 4 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(k.density * 20, 100)}%` }}></div></div>
                                        <div className="text-[10px] font-black w-8 text-right">{k.density}%</div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">{filteredIssues.map((issue: any, index: number) => (<IssueCard key={index} issue={issue} isPrintMode={isPrintMode} />))}</div>
                    )}
                </div>

                {!isPrintMode && (
                    <div className="flex justify-center mt-20 gap-4">
                        <button onClick={() => router.push('/')} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-8 rounded-2xl transition-all">AUDIT ANOTHER SITE</button>
                        <button onClick={() => router.push('/history')} className="bg-white text-black font-bold py-4 px-8 rounded-2xl transition-all">VIEW HISTORY</button>
                    </div>
                )}
                {!isPrintMode && <ChatAssistant auditContext={data ? { ...data, score: data.score ?? undefined } : null} />}
            </div>
        </main>
    );
}
