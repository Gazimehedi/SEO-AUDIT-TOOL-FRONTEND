'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { io } from 'socket.io-client';
import IssueCard from '@/components/IssueCard';
import AuditScore from '@/components/AuditScore';
import ChatAssistant from '@/components/ChatAssistant';
import Navbar from '@/components/Navbar';
import { Zap, Download, FileJson, FileSpreadsheet, FileText, ArrowRight } from 'lucide-react';

export default function AuditResults({ params }: { params: { jobId: string } }) {
    const { data: session } = useSession();
    const [data, setData] = useState<any>(null);
    const [loadingMsg, setLoadingMsg] = useState('Initializing Audit...');
    const [progress, setProgress] = useState(0);
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

    useEffect(() => {
        setIsPrintMode(typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === 'true');
        // Connect websocket
        const socket = io('http://localhost:5000');

        // Fetch initial state in case job is already running or complete
        fetch(`http://localhost:5000/api/audit/${jobId}`)
            .then(res => res.json())
            .then(job => {
                if (job.status === 'complete') {
                    setData(job);
                    if (job.aiSummary) setAiSummary(job.aiSummary);
                } else if (job.status === 'failed') {
                    setError(job.error);
                } else if (job.progress) {
                    setProgress(Math.round((job.progress.crawled / job.progress.total) * 100));
                }
            });

        // Listen to real-time events
        socket.on(`job-${jobId}-progress`, (msg) => {
            setLoadingMsg(msg.text || `Crawling pages... (${msg.crawled})`);
            setProgress(Math.max(10, Math.min(95, msg.crawled * 5))); // Pseudo-progress percentage
        });

        socket.on(`job-${jobId}-step`, (msg) => {
            if (msg.step) setCurrentStep(msg.step);
        });

        socket.on(`job-${jobId}-complete`, (result) => {
            // Re-fetch full job data to be safe, or just use payload
            fetch(`http://localhost:5000/api/audit/${jobId}`)
                .then(res => res.json())
                .then(job => {
                    setData(job);
                    if (job.aiSummary) setAiSummary(job.aiSummary);
                });
        });

        socket.on(`job-${jobId}-failed`, (err) => {
            setError(err.error);
        });

        return () => {
            socket.disconnect();
        };
    }, [jobId, router]);

    const generateAIInsights = async (force = false) => {
        setIsGeneratingAI(true);
        try {
            const res = await fetch(`http://localhost:5000/api/ai/analyze/${jobId}${force ? '?force=true' : ''}`, {
                method: 'POST'
            });
            const result = await res.json();
            if (res.ok) {
                setAiSummary(result);
            } else {
                alert(`AI Generation failed: ${result.error}`);
            }
        } catch (err) {
            console.error('AI Error:', err);
            alert('A network error occurred generating AI summary.');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleDownload = async (url: string, filename: string, id: string) => {
        if (downloading) return;
        setDownloading(id);
        const token = (session as any)?.accessToken;
        try {
            const res = await fetch(url, {
                headers: token ? {
                    'Authorization': `Bearer ${token}`
                } : {}
            });
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                window.URL.revokeObjectURL(downloadUrl);
                link.remove();
            }, 100);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download report. Please ensure you are logged in.');
        } finally {
            setDownloading(null);
        }
    };

    if (!data) {
        const steps = [
            {
                id: 'initializing',
                label: 'Initializing',
                sub: 'Spinning up engine',
                icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                ),
            },
            {
                id: 'crawling',
                label: 'Crawling',
                sub: 'Following all links',
                icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                ),
            },
            {
                id: 'analyzing-performance',
                label: 'Analyzing',
                sub: 'Deep technical checks',
                icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                ),
            },
            {
                id: 'finalizing',
                label: 'Finalizing',
                sub: 'Building your report',
                icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
            },
        ];

        const currentIndex = Math.max(0, steps.findIndex(s => s.id === currentStep));

        return (
            <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[100px]"></div>
                    {/* Grid pattern */}
                    <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '48px 48px' }}></div>
                </div>

                <div className="max-w-2xl w-full relative z-10">
                    {/* Header */}
                    <div className="text-center mb-14">
                        <div className="relative inline-flex items-center justify-center mb-8">
                            {/* Outer glow ring */}
                            <div className="absolute w-28 h-28 rounded-full bg-emerald-500/10 animate-[ping_2s_ease-in-out_infinite]"></div>
                            <div className="absolute w-20 h-20 rounded-full border border-emerald-500/20 animate-[spin_8s_linear_infinite]">
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400"></div>
                            </div>
                            {/* Icon */}
                            <div className="relative w-16 h-16 bg-slate-900 border border-slate-700/80 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        
                        <h1 className="text-4xl font-black tracking-tight mb-3">
                            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                                Auditing in Progress
                            </span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Deep-scanning your website for SEO issues &amp; opportunities</p>
                    </div>

                    {/* Pipeline Steps */}
                    <div className="relative mb-10 px-2">
                        {/* Track line (background) */}
                        <div className="absolute top-9 left-[12%] right-[12%] h-px bg-slate-800"></div>
                        {/* Track line (active fill) */}
                        <div
                            className="absolute top-9 left-[12%] h-px bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-1000 ease-in-out"
                            style={{ width: `calc(${(currentIndex / (steps.length - 1)) * 76}%)` }}
                        ></div>

                        <div className="relative z-10 grid grid-cols-4 gap-2">
                            {steps.map((step, index) => {
                                const isActive = index === currentIndex;
                                const isPast = index < currentIndex;
                                
                                return (
                                    <div key={step.id} className="flex flex-col items-center gap-3">
                                        {/* Step icon bubble */}
                                        <div className={`
                                            relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center
                                            transition-all duration-700 ease-out
                                            ${isActive
                                                ? 'bg-slate-900 border-2 border-emerald-500 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.35)] scale-110'
                                                : isPast
                                                    ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 scale-100'
                                                    : 'bg-slate-900/80 border border-slate-800 text-slate-600 scale-95 opacity-40'
                                            }
                                        `}>
                                            {/* Active pulse ring */}
                                            {isActive && (
                                                <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/40 animate-ping"></div>
                                            )}
                                            {isPast ? (
                                                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                                </svg>
                                            ) : step.icon}
                                        </div>

                                        {/* Step label */}
                                        <div className="text-center">
                                            <div className={`text-[11px] font-black uppercase tracking-[0.12em] transition-colors duration-500 leading-tight ${
                                                isActive ? 'text-white' : isPast ? 'text-emerald-500' : 'text-slate-700'
                                            }`}>
                                                {step.label}
                                            </div>
                                            <div className={`text-[10px] mt-0.5 transition-colors duration-500 ${
                                                isActive ? 'text-emerald-400/70' : isPast ? 'text-slate-600' : 'text-slate-800'
                                            }`}>
                                                {isActive ? '' : step.sub}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Current action ticker */}
                    {loadingMsg && (
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-5 py-2.5 rounded-full backdrop-blur-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></div>
                                <span className="text-xs text-slate-400 font-mono truncate max-w-xs">{loadingMsg}</span>
                            </div>
                        </div>
                    )}

                    {/* Progress bar */}
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-600">Overall Progress</span>
                            <span className={`text-xs font-black px-3 py-1 rounded-full border transition-colors duration-500 ${
                                progress > 60 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                            }`}>
                                {progress}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/50">
                            <div
                                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 h-full rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${Math.max(progress, 3)}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] text-slate-700 mt-3 text-center uppercase tracking-widest font-medium">
                            Checking up to 15 pages · Results ready when complete
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-500 mb-4">Audit Failed</h1>
                    <p className="text-slate-400 text-lg mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all"
                    >
                        Go Back Home
                    </button>
                </div>
            </div>
        );
    }

    const { results, score } = data;
    const { title, description, issues, performanceScore } = results;

    const criticals = issues.filter((i: any) => i.severity === 'Critical');
    const warnings = issues.filter((i: any) => i.severity === 'Warning');
    const passed = issues.filter((i: any) => i.severity === 'Passed');

    // Deduplicate categories and ensure Overview is always first
    const dynamicCategories = Array.from(new Set(issues.map((i: any) => i.category || 'Other'))).sort() as string[];
    
    // Explicit list of core strategic tabs
    const coreTabs = ['Overview', 'Performance', 'Competitors'];
    if (Object.keys(results?.pageMetadata || {}).length > 0) {
        coreTabs.push('Keyword Intelligence');
    }
    
    // Combine core tabs with dynamic categories, avoiding duplicates
    const categories = [
        ...coreTabs,
        ...dynamicCategories.filter(c => !coreTabs.includes(c))
    ];

    const isSpecialTab = coreTabs.includes(selectedCategory);
    
    const filteredIssues = selectedCategory === 'Overview' ? issues : issues.filter((i: any) => i.category === selectedCategory);

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
                        <h1 className="text-4xl font-black text-white tracking-tight mb-3">
                            {data.url.replace(/^https?:\/\//, '')}
                        </h1>
                        <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                            <span className="w-4 h-[1px] bg-slate-800"></span>
                            Generated {new Date(data.createdAt || Date.now()).toLocaleDateString()} at {new Date(data.createdAt || Date.now()).toLocaleTimeString()}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button 
                            disabled={downloading !== null}
                            onClick={() => handleDownload(`http://localhost:5000/api/audit/${jobId}/pdf`, `SEO-Report-${jobId}.pdf`, 'pdf-simple')}
                            className="bg-white/5 hover:bg-white/10 active:bg-white/5 text-white pr-5 pl-4 py-3 rounded-xl border border-white/5 transition-all flex items-center gap-2 groups transition-all"
                        >
                            {downloading === 'pdf-simple' ? <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <FileText className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />}
                            <span className="text-xs font-bold text-slate-400 group-hover:text-white">PDF REPORT</span>
                        </button>
                        <button 
                            disabled={downloading !== null}
                            onClick={() => handleDownload(`http://localhost:5000/api/audit/${jobId}/pdf?type=advanced`, `SEO-Premium-${jobId}.pdf`, 'pdf-adv')}
                            className="bg-blue-600/10 hover:bg-blue-600/20 active:bg-blue-600/10 text-blue-400 pr-5 pl-4 py-3 rounded-xl border border-blue-500/20 transition-all flex items-center gap-2 group transition-all"
                        >
                            {downloading === 'pdf-adv' ? <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                            <span className="text-xs font-bold">PREMIUM</span>
                        </button>
                        <button 
                            disabled={downloading !== null}
                            onClick={() => handleDownload(`http://localhost:5000/api/audit/${jobId}/export?format=csv`, `SEO-Data-${jobId}.csv`, 'csv')}
                            className="bg-white/5 hover:bg-white/10 text-white pr-5 pl-4 py-3 rounded-xl border border-white/5 transition-all flex items-center gap-2 group transition-all"
                        >
                            {downloading === 'csv' ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <FileSpreadsheet className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />}
                            <span className="text-xs font-bold text-slate-400 group-hover:text-white">CSV</span>
                        </button>
                        <button 
                            disabled={downloading !== null}
                            onClick={() => handleDownload(`http://localhost:5000/api/audit/${jobId}/export?format=json`, `SEO-Data-${jobId}.json`, 'json')}
                            className="bg-white/5 hover:bg-white/10 text-white pr-5 pl-4 py-3 rounded-xl border border-white/5 transition-all flex items-center gap-2 group transition-all"
                        >
                            {downloading === 'json' ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <FileJson className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />}
                            <span className="text-xs font-bold text-slate-400 group-hover:text-white">JSON</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start mb-20">
                    <div className="lg:col-span-1">
                        <AuditScore 
                            score={Math.round(score)} 
                            label="SEO Health"
                        />
                        <div className="mt-4">
                            <AuditScore 
                                score={results.performanceScore || 0} 
                                label="Performance"
                            />
                        </div>
                    </div>
                    
                    <div className="lg:col-span-3 h-full">
                        <div className="bg-slate-900/40 border border-white/[0.05] rounded-[32px] p-8 h-full flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">AI Intelligence <span className="text-slate-600">Report</span></h3>
                                </div>

                                {!aiSummary ? (
                                    <div className="space-y-4">
                                        <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                                            Our neural engine hasn&apos;t analyzed this report yet. Generate AI insights to get a prioritized action plan and competitor gap analysis.
                                        </p>
                                        <button 
                                            onClick={() => generateAIInsights()}
                                            disabled={isGeneratingAI}
                                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-3 transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)] text-sm uppercase tracking-widest mt-4"
                                        >
                                            {isGeneratingAI ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-5 h-5" /> Generate AI Core Insights
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5">
                                            <p className="text-slate-300 leading-relaxed font-medium">
                                                {aiSummary.executiveSummary}
                                            </p>
                                        </div>
                                        
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Top Priorities
                                                </h4>
                                                <ul className="space-y-2">
                                                    {aiSummary.topPriorities?.map((p: string, i: number) => (
                                                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                                            <span className="text-red-500 mt-0.5">•</span> {p}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Quick Wins
                                                </h4>
                                                <ul className="space-y-2">
                                                    {aiSummary.quickWins?.map((w: string, i: number) => (
                                                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                                            <span className="text-emerald-500 mt-0.5">•</span> {w}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-2xl font-black text-white tracking-tight">Audit <span className="text-slate-500">Intelligence</span></h2>
                        <div className="flex-1 h-[1px] bg-slate-900"></div>
                    </div>

                    {issues.length > 0 && !isPrintMode && (
                        <div className="mb-12">
                            <div className="flex flex-wrap gap-2 bg-slate-900/40 p-2 rounded-[24px] border border-white/5">
                                {categories.map((cat: any) => (
                                    <button 
                                        key={cat}
                                        id={`tab-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2.5 whitespace-nowrap ${
                                            selectedCategory === cat 
                                            ? 'bg-emerald-500 text-white shadow-[0_10px_20px_rgba(16,185,129,0.2)] border border-emerald-400/50' 
                                            : 'text-slate-500 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/5'
                                        }`}
                                    >
                                        {cat}
                                        {cat === 'Overview' && (
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-600'}`}>
                                                {issues.length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                    <div className="grid gap-4">
                        {selectedCategory === 'Overview' && (
                            <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {issues.length === 0 ? (
                                    <div className="p-8 text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
                                        Amazing! No issues found across the crawled pages. 🚀
                                    </div>
                                ) : (
                                    issues.map((issue: any, index: number) => (
                                        <IssueCard key={index} issue={issue} isPrintMode={isPrintMode} />
                                    ))
                                )}
                            </div>
                        )}

                        {selectedCategory === 'Performance' && (
                            <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Core Web Vitals Gauges */}
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center">
                                        <div className="text-3xl font-black mb-1 text-blue-400">
                                            {results.performanceMetrics?.lcp ? `${(results.performanceMetrics.lcp / 1000).toFixed(2)}s` : 'N/A'}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Largest Contentful Paint (LCP)</div>
                                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${results.performanceMetrics?.lcp > 2500 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min((results.performanceMetrics?.lcp / 4000) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-3 font-medium uppercase tracking-tighter">Goal: &lt; 2.5s</p>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center">
                                        <div className="text-3xl font-black mb-1 text-purple-400">
                                            {results.performanceMetrics?.cls ? results.performanceMetrics.cls.toFixed(3) : '0.000'}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Cumulative Layout Shift (CLS)</div>
                                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${results.performanceMetrics?.cls > 0.1 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min((results.performanceMetrics?.cls / 0.3) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-3 font-medium uppercase tracking-tighter">Goal: &lt; 0.1</p>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center">
                                        <div className="text-3xl font-black mb-1 text-emerald-400">
                                            {results.performanceMetrics?.loadTime ? `${(results.performanceMetrics.loadTime / 1000).toFixed(1)}s` : 'N/A'}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Total Load Time</div>
                                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                            <div 
                                                className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${Math.min((results.performanceMetrics?.loadTime / 5000) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-3 font-medium uppercase tracking-tighter">Network Ready</p>
                                    </div>
                                </div>

                                {/* Desktop vs Mobile Comparison */}
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7s-2 2-2 3v1h8v-1s-2-2-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg>
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                            Desktop Version
                                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md text-[8px] border border-blue-500/20">Active</span>
                                        </h4>
                                        <div className="flex items-end gap-3 mb-2">
                                            <span className="text-5xl font-black text-white">{performanceScore}</span>
                                            <span className="text-slate-500 font-bold mb-1 italic">/ 100</span>
                                        </div>
                                        <p className="text-xs text-slate-400">Optimized for high-speed fiber and large viewports.</p>
                                    </div>

                                    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                            Mobile Version
                                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-md text-[8px] border border-purple-500/20">Emulated</span>
                                        </h4>
                                        <div className="flex items-end gap-3 mb-2">
                                            <span className={`text-5xl font-black ${results.mobileResult?.score < 70 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                                {results.mobileResult?.score || 0}
                                            </span>
                                            <span className="text-slate-500 font-bold mb-1 italic">/ 100</span>
                                        </div>
                                        <p className="text-xs text-slate-400">Based on 4G throttling and Moto G4 emulation.</p>
                                    </div>
                                </div>

                                {/* Advanced Asset Metrics */}
                                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3 underline decoration-emerald-500/30 underline-offset-8">
                                        🛰️ Asset Analysis
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Compression</div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full ${results.performanceMetrics?.isCompressed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                                                <span className="font-bold text-sm tracking-tight">{results.performanceMetrics?.isCompressed ? 'Gzip/Brotli Active' : 'None Detected'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Weight</div>
                                            <div className="text-white font-bold text-sm tracking-tight">
                                                {results.performanceMetrics?.contentSize ? `${(results.performanceMetrics.contentSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Cache Health</div>
                                            <div className="text-white font-bold text-sm tracking-tight">
                                                {results.performanceMetrics?.cacheHits > 0 ? `${results.performanceMetrics.cacheHits} Hits` : 'Bypass/No Cache'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Server Response</div>
                                            <div className="text-emerald-400 font-bold text-sm tracking-tight">
                                                {results.performanceMetrics?.loadTime < 500 ? '⚡ Ultra Fast' : results.performanceMetrics?.loadTime < 1500 ? '✅ Healthy' : '⚠️ Slow'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Specific Issues */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Identified Performance Gaps</h3>
                                    {issues.filter((i: any) => i.category === 'Performance').length === 0 ? (
                                        <div className="p-6 text-center bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-2xl italic text-sm">
                                            No major performance bottlenecks identified. Great job!
                                        </div>
                                    ) : (
                                        issues.filter((i: any) => i.category === 'Performance').map((issue: any, index: number) => (
                                            <IssueCard key={index} issue={issue} isPrintMode={isPrintMode} />
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'Competitors' && (
                            <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Add Competitor Form */}
                                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <span className="text-4xl">⚔️</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Benchmark vs Competitors</h3>
                                    <p className="text-sm text-slate-500 mb-6">Enter a competitor's URL to see how your site stacks up in SEO and Performance.</p>
                                    
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        const form = e.target as HTMLFormElement;
                                        const url = (form.elements.namedItem('competitorUrl') as HTMLInputElement).value;
                                        if (!url) return;

                                        try {
                                            const res = await fetch(`http://localhost:5000/api/competitors/compare/${jobId}`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ competitorUrl: url })
                                            });
                                            if (res.ok) {
                                                alert('Competitor audit started! Results will appear here shortly.');
                                                form.reset();
                                            } else {
                                                const data = await res.json();
                                                alert(`Error: ${data.error}`);
                                            }
                                        } catch (err) {
                                            alert('Failed to start competitor audit.');
                                        }
                                    }} className="flex gap-4">
                                        <input 
                                            name="competitorUrl"
                                            type="url" 
                                            placeholder="https://competitor.com" 
                                            required
                                            className="flex-1 bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                                        />
                                        <button type="submit" className="bg-white text-black font-black px-6 py-3 rounded-xl text-sm hover:bg-slate-200 transition-all">
                                            Add Competitor
                                        </button>
                                    </form>
                                </div>

                                {/* Comparison Table */}
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-950/50">
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Website</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">SEO Score</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Perf. Score</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">LCP (Core Vitals)</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {/* Primary Webstie */}
                                            <tr className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-6">
                                                    <div className="font-bold text-white mb-1 truncate max-w-[200px]">
                                                        {(() => {
                                                            try { return new URL(data.url).hostname; } catch { return 'Current Site'; }
                                                        })()}
                                                    </div>
                                                    <div className="text-[10px] text-blue-400 font-black uppercase tracking-tighter">Your Site</div>
                                                </td>
                                                <td className="p-6 font-black text-2xl">{Math.round(score)}</td>
                                                <td className="p-6 font-black text-2xl text-emerald-400">{results.performanceScore || 0}</td>
                                                <td className="p-6 font-mono text-sm">{results.performanceMetrics?.lcp ? `${(results.performanceMetrics.lcp / 1000).toFixed(2)}s` : 'N/A'}</td>
                                                <td className="p-6">
                                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Original</span>
                                                </td>
                                            </tr>

                                            {/* Competitors */}
                                            {(results.competitors || []).map((comp: any) => (
                                                <tr key={comp.id} className="hover:bg-white/[0.02] transition-colors border-l-2 border-l-purple-500/50">
                                                    <td className="p-6">
                                                        <div className="font-bold text-slate-300 mb-1 truncate max-w-[200px]">
                                                            {(() => {
                                                                try { return new URL(comp.url).hostname; } catch { return 'Competitor'; }
                                                            })()}
                                                        </div>
                                                        <div className="text-[10px] text-purple-400 font-black uppercase tracking-tighter">Competitor</div>
                                                    </td>
                                                    <td className="p-6 font-black text-2xl text-slate-400">{(comp.score === 0 || comp.score) ? comp.score : '--'}</td>
                                                    <td className="p-6 font-black text-2xl text-slate-400">{(comp.performanceScore === 0 || comp.performanceScore) ? comp.performanceScore : '--'}</td>
                                                    <td className="p-6 font-mono text-sm text-slate-400">{comp.lcp ? `${(comp.lcp / 1000).toFixed(2)}s` : '--'}</td>
                                                    <td className="p-6">
                                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                                                            comp.status === 'complete' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse'
                                                        }`}>
                                                            {comp.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {(results.competitors || []).length === 0 && (
                                        <div className="p-10 text-center text-slate-500 italic text-sm">
                                            No competitors added yet. Add one above to start comparisons.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'Keyword Intelligence' && (
                           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                               <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                   <span className="text-blue-400">📊</span> Top 20 Keywords & Density
                               </h3>
                               <p className="text-slate-400 text-sm mb-8">
                                   Analyzed from main body content, excluding navigation, head tags, and common stop-words. 
                                   Density represents the percentage of total words.
                               </p>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                   {Object.values(results.pageMetadata || {})
                                       .flatMap((m: any) => m.keywords || [])
                                       .reduce((acc: any[], current: any) => {
                                           const existing = acc.find(a => a.word === current.word);
                                           if (existing) {
                                               existing.count += current.count;
                                               existing.density = Math.round((existing.density + current.density) / 2 * 100) / 100;
                                           } else {
                                               acc.push({...current});
                                           }
                                           return acc;
                                       }, [])
                                       .sort((a, b) => b.count - a.count)
                                       .slice(0, 20)
                                       .map((keyword: any, i: number) => (
                                           <div key={i} className="flex items-center gap-4 py-2 group">
                                               <div className="w-32 truncate font-bold text-slate-300 group-hover:text-blue-400 transition-colors uppercase tracking-tight text-xs">
                                                   {keyword.word}
                                               </div>
                                               <div className="flex-1 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                                                   <div 
                                                       className={`h-full rounded-full transition-all duration-1000 ${keyword.density > 4 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                       style={{ width: `${Math.min(keyword.density * 20, 100)}%` }}
                                                   ></div>
                                               </div>
                                               <div className="w-16 text-right text-xs font-black">
                                                   <span className={keyword.density > 4 ? 'text-red-400' : 'text-slate-500'}>
                                                       {keyword.density}%
                                                   </span>
                                               </div>
                                           </div>
                                       ))}
                               </div>
                               
                               <div className="mt-12 p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                   <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                                       <span>💡</span> SEO Strategy Hint
                                   </h4>
                                   <p className="text-sm text-slate-400 leading-relaxed">
                                       Aim for a keyword density of **1-2%** for your primary target terms. 
                                       Anything over **4%** may be flagged as keyword stuffing by modern search algorithms.
                                   </p>
                               </div>
                           </div>
                        )}

                        {!isSpecialTab && (
                            <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {filteredIssues.map((issue: any, index: number) => (
                                    <IssueCard key={index} issue={issue} isPrintMode={isPrintMode} />
                                ))}
                            </div>
                        )}
                    </div>

                {!isPrintMode && (
                    <div className="flex justify-center mt-12 gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-8 rounded-xl transition-all"
                        >
                            Audit Another Website
                        </button>
                        <button
                            onClick={() => router.push('/history')}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-8 rounded-xl transition-all"
                        >
                            View History
                        </button>
                    </div>
                )}

                {!isPrintMode && <ChatAssistant auditContext={data || {}} />}
            </div>
        </main>
    );
}
