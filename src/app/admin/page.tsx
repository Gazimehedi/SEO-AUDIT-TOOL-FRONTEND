'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if ((session as any)?.accessToken) fetchData();
    }, [session, status]);

    const fetchData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                fetch('http://localhost:5000/api/admin/stats', {
                    headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
                }),
                fetch('http://localhost:5000/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
                })
            ]);

            if (statsRes.status === 403) {
                router.push('/');
                return;
            }

            const statsData = await statsRes.json();
            const usersData = await usersRes.json();
            
            setStats(statsData);
            setUsers(usersData);
            setLoading(false);
        } catch (err) {
            console.error('Admin fetch error:', err);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user and all their audits?')) return;
        try {
            await fetch(`http://localhost:5000/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
            });
            fetchData();
        } catch (err) { }
    };

    const handleToggleRole = async (id: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            await fetch(`http://localhost:5000/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any).accessToken}`
                },
                body: JSON.stringify({ role: newRole })
            });
            fetchData();
        } catch (err) { }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div></div>;

    return (
        <main className="min-h-screen bg-slate-950 text-white pb-20">
            <Navbar />
            
            <div className="max-w-7xl mx-auto pt-32 px-6">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2">Admin Control</h1>
                        <p className="text-slate-500">Global platform overview and user management.</p>
                    </div>
                    <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                        {['Overview', 'Users', 'Health'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'Overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <StatCard title="Total Users" value={stats.users} icon="👥" color="from-blue-500" />
                        <StatCard title="Total Audits" value={stats.audits.total} icon="📊" color="from-emerald-500" />
                        <StatCard title="Audit Success Rate" value={`${Math.round((stats.audits.complete / stats.audits.total) * 100) || 0}%`} icon="✅" color="from-purple-500" />
                        <StatCard title="Avg SEO Score" value={`${stats.audits.avgScore}%`} icon="🎯" color="from-amber-500" />
                        
                        <div className="md:col-span-2 lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-6">Recent Activity Trend</h3>
                            <div className="h-64 flex items-end gap-3 px-4">
                                {[30, 45, 25, 60, 85, 45, 70, 50, 90, 65, 80, 55].map((h, i) => (
                                    <div key={i} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/30 rounded-t-lg transition-all relative group" style={{ height: `${h}%` }}>
                                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-black px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                             {h} AUDITS
                                         </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-4 px-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm space-y-6">
                            <h3 className="text-xl font-bold">Quick Actions</h3>
                            <div className="space-y-2">
                                <QuickActionButton label="Clear Audit Cache" icon="🧹" />
                                <QuickActionButton label="Export User List" icon="📥" />
                                <QuickActionButton label="System Maintenance" icon="🛠️" color="hover:bg-amber-500/20 hover:text-amber-400" />
                                <QuickActionButton label="Force Failed Retry" icon="🔄" color="hover:bg-blue-500/20 hover:text-blue-400" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Users' && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/80">
                                    <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">User</th>
                                    <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Role</th>
                                    <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Audits</th>
                                    <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-white">{user.name || 'Anonymous'}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center font-mono font-bold text-emerald-400">
                                            {user._count.audits}
                                        </td>
                                        <td className="px-8 py-5 text-right space-x-2">
                                            <button 
                                                onClick={() => handleToggleRole(user.id, user.role)}
                                                className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all"
                                                title="Toggle Admin Role"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A3.323 3.323 0 0010.603 2M10.603 2a3.323 3.323 0 00-4.635 5.86l4.635-5.86zM14 15.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                                title="Delete User"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'Health' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <HealthCard label="CPU Cores" value={stats.system.cpuCount} desc="Logical Processors" />
                        <HealthCard label="Memory" value={`${stats.system.freeMem} Free`} desc={`of ${stats.system.totalMem}`} />
                        <HealthCard label="Uptime" value={stats.system.uptime} desc="Since last restart" />
                        
                        <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-8">
                             <h3 className="text-xl font-bold mb-6">Backend Environment</h3>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                 <div><div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Platform</div><div className="font-mono">{stats.system.platform}</div></div>
                                 <div><div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Node.js</div><div className="font-mono">{process.version || 'v20.x'}</div></div>
                                 <div><div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Database</div><div className="font-mono">MySQL (Local)</div></div>
                                 <div><div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Redis</div><div className="font-mono">Active</div></div>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

function StatCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} blur-[80px] opacity-10 group-hover:opacity-30 transition-all duration-700`}></div>
            <div className="text-3xl mb-4">{icon}</div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{title}</div>
            <div className="text-3xl font-black text-white">{value}</div>
        </div>
    );
}

function HealthCard({ label, value, desc }: any) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl text-center">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{label}</div>
            <div className="text-3xl font-black text-emerald-400 mb-1">{value}</div>
            <div className="text-sm text-slate-500">{desc}</div>
        </div>
    );
}

function QuickActionButton({ label, icon, color = 'hover:bg-slate-800 hover:text-white' }: any) {
    return (
        <button className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 font-bold transition-all border border-transparent hover:border-slate-700 ${color}`}>
            <span className="text-xl">{icon}</span>
            <span className="text-sm">{label}</span>
        </button>
    );
}
