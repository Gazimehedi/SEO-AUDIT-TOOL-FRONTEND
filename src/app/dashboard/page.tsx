/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps, @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Activity, Target, Zap, AlertTriangle, ArrowRight, Plus } from 'lucide-react';

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [history, setHistory] = useState<any[]>([]);
    const [monitoredSites, setMonitoredSites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Dashboard — SEO Pro';
        if (status === 'unauthenticated') router.push('/login');
        if ((session as any)?.accessToken) {
            Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/audit/history`, {
                    headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
                }).then(res => res.json()),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoring`, {
                    headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
                }).then(res => res.json())
            ]).then(([historyData, sitesData]) => {
                setHistory(Array.isArray(historyData) ? historyData : []);
                setMonitoredSites(Array.isArray(sitesData) ? sitesData : []);
                setLoading(false);
            }).catch(err => {
                console.error('Failed to fetch dashboard data:', err);
                setLoading(false);
            });
        }
    }, [session, status, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const totalAudits = history.length;
    const avgScore = totalAudits > 0 ? Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / totalAudits) : 0;
    const alerts = monitoredSites.filter(s => s.previousScore !== null && s.lastScore !== null && s.lastScore < s.previousScore);
    
    // Sort history by date (newest first for recent list, oldest first for chart)
    const sortedHistory = [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentAudits = sortedHistory.slice(0, 5);
    
    const chartData = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).slice(-10); // Last 10 for chart

    return (
        <main className="min-h-screen bg-slate-950 text-white pb-20">
            <Navbar />
            
            <div className="max-w-7xl mx-auto pt-32 px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                            Welcome back, {session?.user?.name || 'User'}
                        </h1>
                        <p className="text-slate-400 font-medium">Here&apos;s what&apos;s happening with your websites today.</p>
                    </div>
                    <button 
                        onClick={() => router.push('/')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> New Audit
                    </button>
                </div>

                {/* High-Level Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-all"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                                    <Target className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Total Audits</h3>
                            </div>
                            <div className="text-5xl font-black text-white">{totalAudits}</div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] group-hover:bg-emerald-500/20 transition-all"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Avg SEO Score</h3>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className={`text-5xl font-black ${avgScore >= 90 ? 'text-emerald-400' : avgScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {avgScore}
                                </div>
                                <div className="text-slate-500 font-bold mb-1">/ 100</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] group-hover:bg-purple-500/20 transition-all"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Monitored Sites</h3>
                            </div>
                            <div className="text-5xl font-black text-white">{monitoredSites.length}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Score History Graph & Alerts */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-black text-white flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-emerald-400" /> Score Trend (Last 10)
                                </h2>
                            </div>
                            
                            {chartData.length >= 2 ? (
                                <div className="h-64 relative w-full flex items-end justify-between gap-2 pt-6">
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                                        <div className="w-full h-px border-b border-dashed border-white"></div>
                                        <div className="w-full h-px border-b border-dashed border-white"></div>
                                        <div className="w-full h-px border-b border-dashed border-white"></div>
                                        <div className="w-full h-px border-b border-dashed border-white"></div>
                                    </div>
                                    
                                    {/* Background labels */}
                                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2 text-[10px] font-bold text-slate-600 -ml-6 border-r border-slate-800 pr-2">
                                        <span>100</span>
                                        <span>75</span>
                                        <span>50</span>
                                        <span>25</span>
                                        <span>0</span>
                                    </div>

                                    {/* Bars */}
                                    {chartData.map((audit, i) => (
                                        <div key={i} className="flex-1 max-w-[40px] h-full flex flex-col justify-end relative group z-10 cursor-pointer" onClick={() => router.push(`/audit/${audit.id}`)}>
                                            <div 
                                                className={`w-full rounded-t-lg transition-all duration-500 group-hover:opacity-80 ${audit.score >= 90 ? 'bg-emerald-500' : audit.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ height: `${audit.score}%` }}
                                            >
                                                {/* Tooltip */}
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700 z-50 shadow-xl">
                                                    <div>{new URL(audit.url).hostname}</div>
                                                    <div className="text-emerald-400">Score: {audit.score}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
                                    Run more audits to see your trend.
                                </div>
                            )}
                        </div>

                        {alerts.length > 0 && (
                            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl">
                                <h3 className="text-red-400 font-black mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" /> Active Alerts
                                </h3>
                                <div className="space-y-3">
                                    {alerts.map(site => (
                                        <div key={site.id} className="bg-slate-950 p-4 rounded-xl border border-red-500/20 flex justify-between items-center group cursor-pointer hover:border-red-500/50 transition-colors" onClick={() => router.push('/monitoring')}>
                                            <div>
                                                <div className="text-white font-bold mb-1">{new URL(site.url).hostname}</div>
                                                <div className="text-xs text-red-400">Score dropped from {site.previousScore} to {site.lastScore}</div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recent Audits */}
                    <div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-2xl h-full">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-black text-white">Recent Audits</h2>
                                <Link href="/history" className="text-emerald-400 hover:text-emerald-300 text-xs font-bold uppercase tracking-widest">
                                    View All
                                </Link>
                            </div>

                            {recentAudits.length === 0 ? (
                                <div className="text-center p-8 bg-slate-950 rounded-2xl border border-slate-800/50">
                                    <p className="text-slate-500 text-sm mb-4">No recent audits found.</p>
                                    <button 
                                        onClick={() => router.push('/')}
                                        className="text-emerald-400 text-xs font-bold uppercase hover:underline"
                                    >
                                        Run an Audit
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentAudits.map((audit) => (
                                        <div 
                                            key={audit.id} 
                                            onClick={() => router.push(`/audit/${audit.id}`)}
                                            className="group flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all"
                                        >
                                            <div className="overflow-hidden flex-1 pr-4">
                                                <div className="text-sm font-bold text-white mb-1 truncate group-hover:text-emerald-400 transition-colors">
                                                    {new URL(audit.url).hostname}
                                                </div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                                                    {new Date(audit.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className={`text-xl font-black flex-shrink-0 ${audit.score >= 90 ? 'text-emerald-400' : audit.score >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {audit.score}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
