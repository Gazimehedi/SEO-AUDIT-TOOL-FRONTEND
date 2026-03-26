/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps, @next/next/no-img-element */
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface UserProfile {
    name?: string;
    email?: string;
    role?: string;
    avatarUrl?: string;
}

interface ExtendedSession {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    accessToken?: string;
}

export default function Navbar() {
    const { data: sessionData } = useSession();
    const session = sessionData as ExtendedSession | null;
    const pathname = usePathname();
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (session?.accessToken) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            })
            .then(res => res.json())
            .then(data => { if (!data.error) setProfile(data); })
            .catch(() => {});
        }
    }, [session]);

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/', label: 'Audit' },
        { href: '/history', label: 'History' },
        { href: '/monitoring', label: 'Monitoring' },
        { href: '/projects', label: 'Projects' },
    ];

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname?.startsWith(href);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            {/* Frosted glass bar */}
            <div className="border-b border-white/[0.06] bg-[#050B14]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-shadow">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <span className="text-base font-black tracking-tight">
                            <span className="text-white">SEO</span>
                            <span className="text-emerald-400"> Pro</span>
                        </span>
                    </Link>

                    {/* Nav links */}
                    {session && (
                        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
                            {navLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                        isActive(link.href)
                                            ? 'text-white bg-white/[0.08]'
                                            : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    {link.label}
                                    {isActive(link.href) && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[1px] w-4 h-0.5 bg-emerald-400 rounded-full" />
                                    )}
                                </Link>
                            ))}
                            {profile?.role === 'admin' && (
                                <Link
                                    href="/admin"
                                    className={`relative px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                                        isActive('/admin')
                                            ? 'text-emerald-300 bg-emerald-500/10'
                                            : 'text-emerald-500 hover:text-emerald-300 hover:bg-emerald-500/10'
                                    }`}
                                >
                                    Admin
                                    {isActive('/admin') && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[1px] w-4 h-0.5 bg-emerald-400 rounded-full" />
                                    )}
                                </Link>
                            )}
                        </nav>
                    )}

                    {/* Right section */}
                    <div className="flex items-center gap-3">
                        {session ? (
                            <>
                                {/* Avatar / Profile */}
                                <Link href="/settings" className="flex items-center gap-2.5 group">
                                    <div className="text-right hidden lg:block">
                                        <div className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors leading-tight">
                                            {profile?.name || session.user?.email?.split('@')[0]}
                                        </div>
                                        <div className="text-[9px] text-slate-600 uppercase tracking-widest font-black">
                                            {profile?.role === 'admin' ? 'Administrator' : 'Member'}
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/10 group-hover:border-emerald-500/40 transition-all shadow-lg bg-slate-900 flex items-center justify-center flex-shrink-0 relative">
                                        {profile?.avatarUrl ? (
                                            <Image
                                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${profile.avatarUrl}`}
                                                alt="Avatar"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span className="text-xs font-black text-emerald-400">
                                                {(profile?.name || session.user?.email || '?')[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </Link>

                                {/* Divider */}
                                <div className="w-px h-5 bg-white/10" />

                                {/* Logout */}
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-xs font-bold transition-colors group"
                                >
                                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-slate-400 hover:text-white text-sm font-semibold transition-colors">
                                    Login
                                </Link>
                                <Link href="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black py-2 px-4 rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
