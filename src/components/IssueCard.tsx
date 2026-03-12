import { useState } from 'react';
import { useParams } from 'next/navigation';

interface Issue {
    severity: string;
    category: string;
    issue: string;
    pageUrl: string;
    location: string;
    recommendation: string;
    code_example?: string;
}

interface Suggestion {
    suggestedTitle: string;
    suggestedDescription: string;
    explanation: string;
}

interface ContentSuggestion {
    improvedH1: string;
    optimizedIntro: string;
    contentGaps: string[];
    recommendedTone: string;
    explanation: string;
}

export default function IssueCard({ issue, isPrintMode = false }: { issue: Issue, isPrintMode?: boolean }) {
    const params = useParams() as any;
    const jobId = params?.jobId as string;
    const [expanded, setExpanded] = useState(isPrintMode);
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
    const [contentSuggestion, setContentSuggestion] = useState<ContentSuggestion | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const isCritical = issue.severity === 'Critical';
    const isPassed = issue.severity === 'Passed';
    
    // Check if this is a meta issue we can help with
    const isMetaIssue = issue.category === 'Meta & Basics' && 
        (issue.issue.toLowerCase().includes('title') || issue.issue.toLowerCase().includes('description'));
    
    const isContentIssue = issue.category === 'Content Quality';

    const handleSuggest = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!jobId) return;
        setIsGenerating(true);
        try {
            const res = await fetch(`http://localhost:5000/api/ai/suggest-meta/${jobId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pageUrl: issue.pageUrl,
                    currentTitle: issue.issue.toLowerCase().includes('title') ? 'Current issue identified' : '',
                    currentDescription: issue.issue.toLowerCase().includes('description') ? 'Current issue identified' : ''
                })
            });
            const data = await res.json();
            if (res.ok) {
                setSuggestion(data);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error('Meta Suggest Error:', err);
            alert('Failed to connect to AI service.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOptimizeContent = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!jobId) return;
        setIsGenerating(true);
        try {
            const res = await fetch(`http://localhost:5000/api/ai/optimize-content/${jobId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageUrl: issue.pageUrl })
            });
            const data = await res.json();
            if (res.ok) {
                setContentSuggestion(data);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error('Content Optimizer Error:', err);
            alert('Failed to connect to AI service.');
        } finally {
            setIsGenerating(false);
        }
    };

    let colorClass, headerTextClass, badgeClass;
    if (isCritical) {
        colorClass = 'border-red-500/50 bg-red-500/5';
        headerTextClass = 'text-red-400';
        badgeClass = 'bg-red-500/20 text-red-400';
    } else if (isPassed) {
        colorClass = 'border-emerald-500/50 bg-emerald-500/5';
        headerTextClass = 'text-emerald-500';
        badgeClass = 'bg-emerald-500/20 text-emerald-500';
    } else {
        colorClass = 'border-yellow-500/50 bg-yellow-500/5';
        headerTextClass = 'text-yellow-400';
        badgeClass = 'bg-yellow-500/20 text-yellow-500';
    }

    return (
        <div className={`border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:border-white/20 ${colorClass}`}>
            <div
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] rounded-lg shadow-sm ${badgeClass}`}>
                        {issue.category}
                    </span>
                    <h3 className={`font-bold text-lg tracking-tight ${headerTextClass}`}>{issue.issue}</h3>
                </div>
                <div className="flex items-center gap-3">
                    {(isMetaIssue || isContentIssue) && !expanded && !isPrintMode && (
                        <button 
                            onClick={isMetaIssue ? handleSuggest : handleOptimizeContent}
                            disabled={isGenerating}
                            className="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                        >
                            <span className="text-sm">✨</span> AI Fix
                        </button>
                    )}
                    <svg className={`w-5 h-5 text-slate-400 transform transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {expanded && (
                <div className="p-5 border-t border-slate-800/50 bg-black/20 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Page URL</span>
                            <div className="text-blue-300 font-mono text-sm mt-1.5 p-3 bg-slate-900 rounded-xl whitespace-pre-wrap break-all border border-blue-500/10">
                                <a href={issue.pageUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{issue.pageUrl || 'Global'}</a>
                            </div>
                        </div>

                        <div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Location</span>
                            <div className="text-slate-300 font-mono text-sm mt-1.5 p-3 bg-slate-900 rounded-xl whitespace-pre-wrap break-all border border-white/5">
                                {issue.location}
                            </div>
                        </div>
                    </div>

                    <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Recommendation</span>
                        <p className="text-slate-300 mt-1.5 text-base leading-relaxed bg-slate-400/5 p-4 rounded-xl italic">
                            {issue.recommendation}
                        </p>
                    </div>

                    {isMetaIssue && !isPrintMode && (
                        <div className="mt-4 p-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <span className="text-6xl">✨</span>
                            </div>
                            
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-purple-400 font-bold flex items-center gap-2 uppercase tracking-widest text-xs">
                                    AI Smart Fix Suggestions
                                </h4>
                                {!suggestion && (
                                    <button 
                                        onClick={handleSuggest}
                                        disabled={isGenerating}
                                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 px-4 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isGenerating ? 'Analyzing...' : 'Suggest Optimized Meta'}
                                    </button>
                                )}
                            </div>

                            {suggestion && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div className="grid gap-4">
                                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Optimized Title</span>
                                                <button onClick={() => navigator.clipboard.writeText(suggestion.suggestedTitle)} className="text-[10px] text-purple-400 hover:text-purple-300 uppercase font-bold">Copy</button>
                                            </div>
                                            <p className="text-emerald-400 font-bold text-sm">{suggestion.suggestedTitle}</p>
                                        </div>
                                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Optimized Description</span>
                                                <button onClick={() => navigator.clipboard.writeText(suggestion.suggestedDescription)} className="text-[10px] text-purple-400 hover:text-purple-300 uppercase font-bold">Copy</button>
                                            </div>
                                            <p className="text-slate-300 text-sm leading-relaxed">{suggestion.suggestedDescription}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 italic">💡 {suggestion.explanation}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {isContentIssue && !isPrintMode && (
                        <div className="mt-4 p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <span className="text-6xl">✍️</span>
                            </div>
                            
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-blue-400 font-bold flex items-center gap-2 uppercase tracking-widest text-xs">
                                    AI Content Strategy Fix
                                </h4>
                                {!contentSuggestion && (
                                    <button 
                                        onClick={handleOptimizeContent}
                                        disabled={isGenerating}
                                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-4 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isGenerating ? 'Analyzing...' : 'Optimize Content'}
                                    </button>
                                )}
                            </div>

                            {contentSuggestion && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div className="grid gap-4">
                                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">Improved H1 Header</span>
                                            <p className="text-blue-400 font-bold text-lg">{contentSuggestion.improvedH1}</p>
                                        </div>
                                        
                                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">SEO Optimized Introduction</span>
                                            <p className="text-slate-300 text-sm leading-relaxed italic">&quot;{contentSuggestion.optimizedIntro}&quot;</p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">Content Gaps (Topics to Add)</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {contentSuggestion.contentGaps.map((gap: string, i: number) => (
                                                        <span key={i} className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-1 rounded-md border border-blue-500/20">
                                                            {gap}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">Recommended Tone</span>
                                                <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider">{contentSuggestion.recommendedTone}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-xs text-slate-500 italic border-t border-slate-800 pt-3">💡 {contentSuggestion.explanation}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {issue.code_example && !suggestion && (
                        <div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Technical Implementation</span>
                            <div className="text-emerald-400 font-mono text-sm mt-1.5 p-4 bg-slate-900 border border-emerald-500/10 rounded-xl overflow-x-auto shadow-inner">
                                {issue.code_example}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
