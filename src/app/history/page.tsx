'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';

export default function AuditHistory() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        document.title = 'Audit History — SEO Pro';
        if (status === 'unauthenticated') { router.push('/login'); return; }
        if (status === 'authenticated') {
            fetch('http://localhost:5000/api/audit/history', {
                headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
            })
            .then(res => res.json())
            .then(data => { setHistory(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
        }
    }, [status, session, router]);

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setConfirmDeleteId(id);
    };

    const executeDelete = async () => {
        if (!confirmDeleteId) return;
        setDeletingId(confirmDeleteId);
        try {
            const res = await fetch(`http://localhost:5000/api/audit/${confirmDeleteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
            });
            if (res.ok) {
                setHistory(prev => prev.filter(a => a.id !== confirmDeleteId));
                setConfirmDeleteId(null);
            }
        } catch {}
        finally { setDeletingId(null); }
    };

    const scoreColor = (s: number) => s >= 90 ? 'text-emerald-400' : s >= 70 ? 'text-yellow-400' : 'text-red-400';
    const scoreBg = (s: number) => s >= 90 ? 'bg-emerald-500/10 border-emerald-500/20' : s >= 70 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

    return (
        <div className="min-h-screen bg-[#050B14] text-white">
            <Navbar />

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-blue-500/[0.04] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-[100px]"></div>
            </div>

            <main className="relative z-10 max-w-4xl mx-auto pt-24 px-6 pb-20">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Your Reports</p>
                        <h1 className="text-3xl font-black tracking-tight text-white">
                            Audit <span className="text-slate-500">History</span>
                        </h1>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-400 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Audit
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="h-20 bg-slate-900/40 border border-white/[0.04] rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : history.length === 0 ? (
                    <div className="bg-slate-900/40 border border-white/[0.05] p-16 rounded-3xl text-center">
                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-800">
                            <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-slate-500 mb-6">No audit history yet.</p>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white font-black py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] text-sm"
                        >
                            Run First Audit
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {history.map((audit) => (
                            <div
                                key={audit.id}
                                onClick={() => router.push(`/audit/${audit.id}`)}
                                className="group bg-slate-900/50 border border-white/[0.05] rounded-2xl px-5 py-4 hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all cursor-pointer flex items-center gap-4"
                            >
                                {/* Score badge */}
                                <div className={`w-14 h-14 rounded-xl border flex-shrink-0 flex flex-col items-center justify-center ${scoreBg(audit.score)}`}>
                                    <span className={`text-lg font-black leading-none ${scoreColor(audit.score)}`}>{audit.score}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 mt-0.5">score</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-emerald-400 font-mono text-xs truncate mb-0.5">{audit.url}</p>
                                    <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                                        {audit.results?.title ? audit.results.title.substring(0, 80) : 'Audit Report'}
                                    </h3>
                                    <p className="text-slate-600 text-[10px] mt-0.5">
                                        {new Date(audit.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <svg className="w-4 h-4 text-slate-700 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <button
                                        onClick={(e) => handleDeleteClick(e, audit.id)}
                                        disabled={deletingId === audit.id}
                                        className="p-1.5 text-slate-700 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                    >
                                        {deletingId === audit.id ? (
                                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Delete Confirm Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10 flex flex-col items-center text-center gap-5">
                            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400">
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white mb-1">Delete Report?</h3>
                                <p className="text-slate-500 text-sm">This audit will be permanently deleted and cannot be recovered.</p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors">Cancel</button>
                                <button
                                    onClick={executeDelete}
                                    disabled={deletingId !== null}
                                    className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deletingId ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
