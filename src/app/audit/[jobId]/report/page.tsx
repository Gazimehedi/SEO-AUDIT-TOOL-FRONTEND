'use client';

import { useEffect, useState } from 'react';

export default function PremiumReportPage({ params }: { params: { jobId: string } }) {
    const { jobId } = params;
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        document.title = 'SEO Audit Report';
        if (jobId) {
            fetch(`http://localhost:5000/api/audit/${jobId}`)
                .then(res => res.json())
                .then(job => {
                    if (job.status === 'complete' || job.results) {
                        setData(job);
                    }
                });
        }
    }, [jobId]);

    if (!data) return <div className="p-10 font-sans text-center text-slate-500">Generating report data...</div>;

    const score = data.score || 0;
    const results = data.results || {};
    const { title, issues = [], performanceScore = 0 } = results;
    const createdAt = data.createdAt;

    const criticals = issues.filter((i: any) => i.severity === 'Critical');
    const warnings = issues.filter((i: any) => i.severity === 'Warning');
    const passed = issues.filter((i: any) => i.severity === 'Passed');
    
    const categories: Record<string, any[]> = {};
    issues.forEach((issue: any) => {
        if (!categories[issue.category]) categories[issue.category] = [];
        categories[issue.category].push(issue);
    });

    const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    let domain = data.url;
    try { domain = new URL(data.url).hostname; } catch {}

    const ScoreRing = ({ value, label }: { value: number, label: string }) => {
        const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';
        return (
            <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * value) / 100} strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-slate-800 tracking-tighter" style={{ color }}>{value}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">/ 100</span>
                    </div>
                </div>
                <span className="text-sm font-bold text-slate-600 uppercase tracking-widest mt-6">{label}</span>
            </div>
        );
    };

    return (
        <div className="bg-white text-slate-900 min-h-screen font-sans" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            
            {/* --- COVER PAGE --- */}
            <div className="min-h-[100vh] relative overflow-hidden flex flex-col justify-between" style={{ pageBreakAfter: 'always' }}>
                {/* Background Styling */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-slate-950"></div>
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex-1 flex flex-col p-12">
                    {/* Brand Header */}
                    <div className="flex items-center gap-3 text-white mb-auto">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                        <span className="text-xl font-bold tracking-wider">SEO PRO</span>
                    </div>

                    {/* Title Area */}
                    <div className="my-auto space-y-8">
                        <div className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-300 font-bold px-5 py-2 rounded-full text-xs uppercase tracking-[0.2em]">
                            Comprehensive Website Audit
                        </div>
                        <h1 className="text-7xl font-black text-white leading-tight tracking-tight">
                            Performance &<br />SEO Analysis
                        </h1>
                        <div className="w-24 h-2 bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"></div>
                        <div className="pt-8 space-y-2">
                            <p className="text-slate-400 font-medium uppercase tracking-widest text-sm">Target Domain</p>
                            <p className="text-4xl text-white font-medium break-words">{domain}</p>
                        </div>
                    </div>

                    {/* Footer Area */}
                    <div className="mt-auto border-t border-slate-800 pt-8 flex justify-between items-end">
                        <div>
                            <p className="text-slate-500 font-medium uppercase tracking-widest text-xs mb-1">Generated On</p>
                            <p className="text-white font-medium">{formattedDate}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-sm">Automated Intelligence Report</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- EXECUTIVE SUMMARY --- */}
            <div className="p-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Executive Summary</h2>
                        <p className="text-slate-500 mt-1">High-level overview of site health and performance.</p>
                    </div>
                </div>

                {/* Score Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 mb-8 shadow-sm">
                    <div className="grid grid-cols-2 gap-8">
                        <ScoreRing value={score} label="Overall SEO Health" />
                        <ScoreRing value={performanceScore || 0} label="Performance Index" />
                    </div>
                </div>

                {/* Key Metrics */}
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Audit Metrics</h3>
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-3">Pages Analyzed</div>
                        <div className="text-5xl font-black text-slate-900">{data.progress?.crawled || 1}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                        <div className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-3">Critical Issues</div>
                        <div className="text-5xl font-black text-red-600">{criticals.length}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                        <div className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-3">Warnings</div>
                        <div className="text-5xl font-black text-yellow-600">{warnings.length}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                        <div className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-3">Passed Checks</div>
                        <div className="text-5xl font-black text-emerald-600">{passed.length}</div>
                    </div>
                </div>

                {/* Categories Table View */}
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Category Breakdown</h3>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-bold">
                            <tr>
                                <th className="px-6 py-4">Audit Category</th>
                                <th className="px-6 py-4 text-center">Issues Found</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {Object.entries(categories).map(([catName, cats]: [string, any]) => {
                                const hasCritical = cats.some((c: any) => c.severity === 'Critical');
                                return (
                                    <tr key={catName}>
                                        <td className="px-6 py-4 font-bold text-slate-800">{catName}</td>
                                        <td className="px-6 py-4 text-center font-medium text-slate-600">{cats.length}</td>
                                        <td className="px-6 py-4 text-center">
                                            {hasCritical ? (
                                                <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider rounded-full">Needs Attention</span>
                                            ) : cats.some((c: any) => c.severity === 'Warning') ? (
                                                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wider rounded-full">Review</span>
                                            ) : (
                                                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full">Healthy</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {Object.keys(categories).length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500 font-medium">No issues found across any category.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- DETAILED FINDINGS --- */}
            <div className="p-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8 pt-8 border-t-4 border-slate-900">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Detailed Findings</h2>
                        <p className="text-slate-500 mt-1">Full breakdown of all discovered issues and actionable recommendations.</p>
                    </div>
                </div>

                {Object.keys(categories).length === 0 ? (
                     <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-200">
                         <p className="text-xl text-slate-600 font-medium">No technical issues were identified during this audit.</p>
                     </div>
                ) : (
                    Object.keys(categories).map((categoryName) => (
                        <div key={categoryName} className="mb-10" style={{ pageBreakInside: 'avoid' }}>
                            <h3 className="text-xl font-black text-slate-900 mb-6 pb-2 border-b-2 border-slate-200">{categoryName}</h3>
                            
                            <div className="space-y-6">
                                {categories[categoryName].map((issue: any, index: number) => {
                                    const isCritical = issue.severity === 'Critical';
                                    const isPassed = issue.severity === 'Passed';
                                    return (
                                        <div key={index} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" style={{ pageBreakInside: 'avoid' }}>
                                            {/* Card Header */}
                                            <div className={`px-6 py-4 border-b ${isCritical ? 'bg-red-50/50 border-red-100' : isPassed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-yellow-50/50 border-yellow-100'} flex items-start gap-4`}>
                                                <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${isCritical ? 'bg-red-100 text-red-600' : isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                    {isPassed ? '✓' : '!'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg text-slate-900 leading-tight">{issue.issue}</h4>
                                                    <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${isCritical ? 'bg-red-100 text-red-700' : isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {issue.severity} Status
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Card Body */}
                                            <div className="p-5">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Detected Location</span>
                                                        <code className="block bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-lg text-sm break-all font-mono">
                                                            {issue.location}
                                                        </code>
                                                    </div>
                                                    {issue.pageUrl && (
                                                        <div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Affected Page URL</span>
                                                            <div className="bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-lg text-sm truncate font-medium">
                                                                {issue.pageUrl}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1">Recommended Action</span>
                                                    <p className="text-slate-700 text-sm font-medium leading-relaxed">{issue.recommendation}</p>
                                                    
                                                    {issue.code_example && (
                                                        <div className="mt-3 pt-3 border-t border-blue-100/50">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Example / Implementation</span>
                                                            <code className="block bg-slate-800 text-emerald-400 px-3 py-2 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre">
                                                                {issue.code_example}
                                                            </code>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* CSS Print Styles */}
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: A4 portrait; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white; }
                    /* Make it so every printed page gets a nice minimal footer via CSS content if we wanted, but keeping it simple is safer */
                }
            `}</style>
        </div>
    );
}
