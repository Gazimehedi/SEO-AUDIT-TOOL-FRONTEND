/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps, @next/next/no-img-element */
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface AuditContext {
    url?: string;
    score?: number;
    results?: any;
}

export default function ChatAssistant({ auditContext }: { auditContext: AuditContext | null }) {
    const params = useParams();
    const jobId = params?.jobId as string;
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, isOpen]);

    const handleSend = async (e?: React.FormEvent, customMsg?: string) => {
        if (e) e.preventDefault();
        
        const userMsg = customMsg || message.trim();
        if (!userMsg || isLoading) return;

        setMessage('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ai/chat/${jobId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMsg,
                    history: chatHistory 
                })
            });
            const data = await res.json();
            if (res.ok) {
                setChatHistory(prev => [...prev, { role: 'assistant', content: data.message }]);
            } else {
                setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
            }
        } catch (error) {
            console.error('Chat AI Error:', error);
            setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I&apos;m having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Bubble */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] group overflow-hidden border-2 border-white/10"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-800 to-purple-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                {isOpen ? (
                    <svg className="w-8 h-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <span className="text-3xl animate-pulse relative z-10">💬</span>
                )}
                {!isOpen && (
                    <span className="absolute -top-12 right-0 bg-slate-800 text-white text-[10px] font-black px-3 py-2 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 uppercase tracking-widest">
                        Ask SEO Assistant ✨
                    </span>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-28 right-8 w-[380px] h-[550px] bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl flex flex-col z-[100] overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-300">
                    <div className="p-5 bg-gradient-to-r from-purple-700 to-purple-600 flex items-center justify-between border-b border-purple-500/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shadow-inner">
                                ✨
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">SEO Expert AI</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                    <p className="text-[10px] font-bold text-purple-100 opacity-80 uppercase tracking-widest">Active Assistant</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                        {chatHistory.length === 0 && (
                            <div className="text-center py-6 space-y-5">
                                <span className="text-5xl block animate-bounce">🤖</span>
                                <div className="space-y-2">
                                    <p className="text-slate-300 text-sm font-medium px-4">
                                        Hello! I&apos;ve analyzed your audit for <span className="text-purple-400 font-bold underline decoration-purple-500/30">{auditContext?.url}</span>.
                                    </p>
                                    <p className="text-slate-500 text-xs px-6">
                                        Ask me anything about your current SEO score, specific issues, or how to rank higher.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-2.5 px-6">
                                    {[
                                        "Why is my score so low?", 
                                        "What should I fix first?", 
                                        "How do I fix Thin Content?",
                                        "Suggest 3 high-impact wins"
                                    ].map(hint => (
                                        <button 
                                            key={hint}
                                            onClick={() => handleSend(undefined, hint)}
                                            className="text-[11px] font-bold bg-slate-950/50 hover:bg-purple-600 border border-slate-800 hover:border-purple-400 text-slate-400 hover:text-white py-2.5 px-4 rounded-xl transition-all text-left"
                                        >
                                            &ldquo;{hint}&rdquo;
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[88%] p-4 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-600/10 font-medium' 
                                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 shadow-sm'
                                }`}>
                                    {msg.content.split('\n').map((line, j) => (
                                        <p key={j} className={j > 0 ? 'mt-3' : ''}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800/50 backdrop-blur-sm px-5 py-4 rounded-2xl rounded-tl-none border border-slate-700/50 flex gap-1.5 items-center">
                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.4s]"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md">
                        <div className="relative group">
                            <input 
                                type="text" 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ask about your audit..."
                                className="w-full bg-black/40 border-2 border-slate-800 text-white text-sm rounded-2xl py-3.5 pl-5 pr-14 focus:outline-none focus:border-purple-600/50 transition-all placeholder:text-slate-600"
                            />
                            <button 
                                type="submit"
                                disabled={!message.trim() || isLoading}
                                className="absolute right-2 top-2 bottom-2 px-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-600/20 disabled:opacity-30 disabled:hover:shadow-none transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
