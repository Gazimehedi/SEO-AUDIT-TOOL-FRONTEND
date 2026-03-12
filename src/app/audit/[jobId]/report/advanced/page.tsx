'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
    CheckCircle2, 
    AlertCircle, 
    Zap, 
    Search, 
    ShieldCheck, 
    Globe, 
    Smartphone,
    Layout
} from 'lucide-react';

interface AuditResult {
    id: string;
    url: string;
    score: number;
    results: any;
    aiSummary: any;
    createdAt: string;
}

export default function AdvancedReportPage() {
    const { jobId } = useParams();
    const { data: session } = useSession();
    const [audit, setAudit] = useState<AuditResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        if (jobId) {
            fetchAudit();
            if (session) fetchProfile();
        }
    }, [jobId, session]);

    const fetchAudit = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/audit/${jobId}`);
            const data = await res.json();
            if (!data.error) setAudit(data);
        } catch (err) {
            console.error('Fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/user/profile', {
                headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
            });
            const data = await res.json();
            if (!data.error) setUserProfile(data);
        } catch (err) {}
    };

    if (loading) return <div className="p-20 text-center font-black uppercase tracking-widest text-slate-500">Generating Report...</div>;
    if (!audit) return <div className="p-20 text-center font-black uppercase tracking-widest text-red-500">Audit Not Found</div>;

    const results = audit.results || {};
    const categories = Array.isArray(results.categories) ? results.categories : results.categories || {};
    const ai = audit.aiSummary || {};
    const score = Math.round(audit.score || 0);

    return (
        <div className="bg-white text-slate-900 min-h-screen p-0 sm:p-8 md:p-12 font-sans selection:bg-blue-100">
            {/* PAGE 1: COVER PAGE */}
            <div className="w-full max-w-4xl mx-auto bg-white border-b-2 border-slate-100 pb-20 mb-20 min-h-[1000px] flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-24">
                        <div className="flex items-center gap-3">
                            {userProfile?.reportLogoUrl ? (
                                <img src={`http://localhost:5000${userProfile.reportLogoUrl}`} alt="Logo" className="h-12 w-auto object-contain" />
                            ) : (
                                <div className="bg-slate-900 text-white px-4 py-2 font-black italic tracking-tighter text-xl">SEO PRO</div>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Generated On</div>
                            <div className="text-sm font-bold">{new Date(audit.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-6xl font-black tracking-tighter leading-tight">
                            Website <span className="text-blue-600 italic">Audit</span> & Strategy Report
                        </h1>
                        <div className="text-2xl font-bold text-slate-500 tracking-tight flex items-center gap-3">
                            <Globe className="w-6 h-6 text-slate-300" /> {new URL(audit.url).hostname}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-[3rem] p-12 flex items-center justify-between border border-slate-100">
                    <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overall Performance Score</div>
                        <div className="text-7xl font-black tracking-tighter text-slate-900">{score}<span className="text-3xl text-slate-300">/100</span></div>
                    </div>
                    <div className="flex gap-4">
                         {Object.values(categories).slice(0, 3).map((cat: any) => (
                             <div key={cat.title} className="text-center group">
                                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-lg mb-2 border-2 transition-all ${cat.score >= 0.9 ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 'border-amber-100 text-amber-600 bg-amber-50'}`}>
                                     {Math.round(cat.score * 100)}
                                 </div>
                                 <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">{cat.title}</div>
                             </div>
                         ))}
                    </div>
                </div>
            </div>

            {/* PAGE 2: AI EXECUTIVE SUMMARY */}
            <div className="w-full max-w-4xl mx-auto pb-20 mb-20 min-h-[1000px] page-break-before">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">Executive Summary</h2>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">AI-Generated Insights & Priorities</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 mb-6 italic">Strategic Overview</h3>
                        <p className="text-slate-700 leading-relaxed font-medium">
                            {ai.executiveSummary || 'No summary available.'}
                        </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 mb-6 italic">Quick Wins</h3>
                        <ul className="space-y-4">
                            {(ai.quickWins || []).map((win: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm font-bold text-slate-700">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    {win}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="bg-slate-900 text-white rounded-[3rem] p-10">
                     <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6">Top Priorities</h3>
                     <div className="space-y-6">
                        {(ai.topPriorities || []).map((prio: any, i: number) => (
                            <div key={i} className="flex items-start gap-4 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                                <span className="bg-white/10 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0">{i + 1}</span>
                                <div>
                                    <h4 className="font-black text-lg mb-1 tracking-tight">{prio.task}</h4>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">{prio.explanation}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>

            {/* PAGE 3: TECHNICAL DEEP DIVE */}
            <div className="w-full max-w-4xl mx-auto pb-20 mb-20 min-h-[1000px] page-break-before">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                        <Layout className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">Technical Breakdown</h2>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest italic">In-depth performance & infrastructure analysis</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {Object.keys(categories).map(catId => {
                        const cat = categories[catId];
                        return (
                            <div key={catId} className="border border-slate-100 rounded-3xl p-8 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border-2 ${cat.score >= 0.9 ? 'border-emerald-100 text-emerald-600 bg-white' : 'border-amber-100 text-amber-600 bg-white'}`}>
                                            {Math.round(cat.score * 100)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight uppercase italic">{cat.title}</h3>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Category Analysis</div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Section {catId.toUpperCase()}</span>
                                </div>

                                <div className="space-y-4">
                                    {(cat.audits || []).filter((a: any) => a.score < 1).slice(0, 5).map((a: any, i: number) => (
                                        <div key={i} className="flex gap-4 p-5 bg-white border border-slate-100 rounded-2xl">
                                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-black mb-1">{a.title}</h4>
                                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{a.description?.replace(/\[Learn more\].*/g, '')}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(cat.audits || []).filter((a: any) => a.score >= 1).slice(0, 3).map((a: any, i: number) => (
                                        <div key={i} className="flex gap-4 p-4 border border-emerald-50/30 rounded-2xl opacity-40">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <h4 className="text-sm font-bold text-slate-400">{a.title}</h4>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* PAGE 4: FOOTER / NEXT STEPS */}
            <div className="w-full max-w-4xl mx-auto pt-24 border-t-4 border-slate-900 flex flex-col items-center text-center page-break-before">
                <div className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black tracking-tighter text-2xl mb-8 uppercase italic">SEO PRO AUDIT</div>
                <h2 className="text-4xl font-black mb-4 italic tracking-tighter">Ready to take your SEO to the next level?</h2>
                <p className="text-slate-500 font-medium max-w-md mb-12 leading-relaxed">
                    This report provides a roadmap for your digital success. Implement the priorities on Page 2 for immediate impact.
                </p>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-1">Confidential Report</div>
                <div className="text-xs font-bold text-slate-400 italic">Created with SEO Pro Website Auditor</div>
            </div>

            <style jsx global>{`
                @media print {
                    body { background: white; padding: 0; }
                    .page-break-before { page-break-before: always; }
                    .min-h-\\[1000px\\] { min-height: 297mm; }
                    .bg-slate-950, .bg-slate-900 { -webkit-print-color-adjust: exact; background-color: #0f172a !important; color: white !important; }
                    .text-blue-600 { color: #2563eb !important; }
                    .bg-blue-600 { background-color: #2563eb !important; }
                    .bg-blue-50 { background-color: #eff6ff !important; }
                    .bg-emerald-50 { background-color: #ecfdf5 !important; }
                }
            `}</style>
        </div>
    );
}
