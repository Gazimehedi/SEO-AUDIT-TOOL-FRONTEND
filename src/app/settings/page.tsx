'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('General');
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Forms state
    const [formData, setFormData] = useState({ name: '', bio: '' });
    const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [notifData, setNotifData] = useState({ notifyOnScoreDrop: true, notifyWeekly: true });
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [newKeyLabel, setNewKeyLabel] = useState('');
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [twoFactor, setTwoFactor] = useState({ qrCode: '', secret: '', token: '', enabled: false });

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if ((session as any)?.accessToken) fetchProfile();
    }, [session, status]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/user/profile', {
                headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
            });
            const data = await res.json();
            setProfile(data);
            setFormData({ name: data.name || '', bio: data.bio || '' });
            setNotifData({ notifyOnScoreDrop: data.notifyOnScoreDrop, notifyWeekly: data.notifyWeekly });
            setTwoFactor(prev => ({ ...prev, enabled: data.twoFactorEnabled }));
            setLoading(false);

            // Fetch keys if on Dev tab or initially (small cost)
            fetchApiKeys();
        } catch (err) {
            console.error('Fetch error:', err);
        }
    };

    const fetchApiKeys = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/user/api-keys', {
                headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
            });
            const data = await res.json();
            setApiKeys(data);
        } catch (err) { }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('http://localhost:5000/api/user/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any).accessToken}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                fetchProfile();
            }
        } catch (err) { }
        setSaving(false);
    };

    const handleUpdateNotifications = async () => {
        setSaving(true);
        try {
            await fetch('http://localhost:5000/api/user/notifications', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any).accessToken}`
                },
                body: JSON.stringify(notifData)
            });
            setMessage({ type: 'success', text: 'Notification preferences saved.' });
        } catch (err) { }
        setSaving(false);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pwdData.newPassword !== pwdData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('http://localhost:5000/api/user/password', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any).accessToken}`
                },
                body: JSON.stringify({ currentPassword: pwdData.currentPassword, newPassword: pwdData.newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Password changed.' });
                setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (err) { }
        setSaving(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const fd = new FormData();
        fd.append('avatar', file);

        setSaving(true);
        try {
            const res = await fetch('http://localhost:5000/api/user/avatar', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${(session as any).accessToken}` },
                body: fd
            });
            if (res.ok) {
                fetchProfile();
                setMessage({ type: 'success', text: 'Avatar updated!' });
            }
        } catch (err) { }
        setSaving(false);
    };

    const handleReportLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const fd = new FormData();
        fd.append('reportLogo', file);

        setSaving(true);
        try {
            const res = await fetch('http://localhost:5000/api/user/report-logo', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${(session as any).accessToken}` },
                body: fd
            });
            if (res.ok) {
                fetchProfile();
                setMessage({ type: 'success', text: 'Report logo updated!' });
            }
        } catch (err) { }
        setSaving(false);
    };

    const handleSetup2FA = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/user/2fa/setup', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
            });
            const data = await res.json();
            setTwoFactor(prev => ({ ...prev, qrCode: data.qrCodeUrl, secret: data.secret }));
        } catch (err) { }
    };

    const handleVerify2FA = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/user/2fa/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any).accessToken}`
                },
                body: JSON.stringify({ token: twoFactor.token })
            });
            if (res.ok) {
                setTwoFactor(prev => ({ ...prev, enabled: true, qrCode: '' }));
                setMessage({ type: 'success', text: '2FA Enabled!' });
            } else {
                alert('Invalid code');
            }
        } catch (err) { }
    };

    const handleCreateApiKey = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/user/api-keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any).accessToken}`
                },
                body: JSON.stringify({ label: newKeyLabel || 'My API Key' })
            });
            const data = await res.json();
            setGeneratedKey(data.token);
            setNewKeyLabel('');
            fetchApiKeys();
        } catch (err) { }
    };

    const handleRevokeKey = async (id: string) => {
        try {
            await fetch(`http://localhost:5000/api/user/api-keys/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
            });
            fetchApiKeys();
        } catch (err) { }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div></div>;

    const tabs = ['General', 'Security', 'Notifications', 'Developer', 'Usage Stats'];

    return (
        <main className="min-h-screen bg-slate-950 text-white pb-20">
            <Navbar />
            
            <div className="max-w-6xl mx-auto pt-32 px-6">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <div className="md:w-64 space-y-1">
                        <h1 className="text-2xl font-black text-white mb-6 pl-2 leading-none">Settings</h1>
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${
                                    activeTab === tab 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' 
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900 border-l-4 border-transparent'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-slate-900/50 border border-slate-800/50 rounded-3xl p-8 backdrop-blur-sm min-h-[600px] shadow-2xl relative overflow-hidden">
                        {/* Status Message */}
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                {message.text}
                            </div>
                        )}

                        {activeTab === 'General' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div>
                                    <h2 className="text-xl font-black text-white mb-2">Public Profile</h2>
                                    <p className="text-sm text-slate-500">Control how other users and search engines see you.</p>
                                </div>

                                    <div className="flex items-center gap-6">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden group-hover:border-emerald-500 transition-all">
                                                {profile?.avatarUrl ? (
                                                    <img src={`http://localhost:5000${profile.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-600 uppercase">
                                                        {profile?.email[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <label className="absolute -bottom-2 -right-2 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg cursor-pointer shadow-lg transition-all scale-90 group-hover:scale-100">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                                <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                                            </label>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-white">{profile?.name || 'Your Name'}</div>
                                            <div className="text-sm text-slate-500">{profile?.email}</div>
                                            <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Public Avatar</div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-800/30"></div>

                                    <div>
                                        <h2 className="text-xl font-black text-white mb-2 underline decoration-blue-500/30 underline-offset-8">Report Branding</h2>
                                        <p className="text-sm text-slate-500 mb-6 font-medium italic">White-label your SEO reports with a custom logo.</p>
                                        <div className="flex items-center gap-8 bg-slate-950 p-6 rounded-3xl border border-white/5 shadow-inner">
                                            <div className="w-32 h-20 rounded-xl bg-slate-900 border border-slate-800/50 flex items-center justify-center overflow-hidden relative group">
                                                {profile?.reportLogoUrl ? (
                                                    <img src={`http://localhost:5000${profile.reportLogoUrl}`} alt="Report Logo" className="max-w-full max-h-full object-contain p-2" />
                                                ) : (
                                                    <div className="text-[10px] text-slate-700 font-black uppercase text-center tracking-widest px-2 leading-none">
                                                        No Logo<br/><span className="text-[8px] opacity-50 italic">Using Default</span>
                                                    </div>
                                                )}
                                                <label className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all backdrop-blur-[2px]">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                                                    <input type="file" className="hidden" onChange={handleReportLogoUpload} accept="image/*" />
                                                </label>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Corporate Logo</h4>
                                                <p className="text-[10px] text-slate-600 font-medium">Recommended: PNG / SVG with transparent background.<br/>Min width: 200px</p>
                                            </div>
                                        </div>
                                    </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Display Name</label>
                                        <input 
                                            type="text" 
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all text-slate-200"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Bio</label>
                                        <textarea 
                                            rows={3}
                                            value={formData.bio}
                                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all text-slate-200"
                                            placeholder="SEO Enthusiast and digital marketer."
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={saving}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'Security' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <section>
                                    <h2 className="text-xl font-black text-white mb-6">Change Password</h2>
                                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                                        <input 
                                            type="password" 
                                            placeholder="Current Password"
                                            value={pwdData.currentPassword}
                                            onChange={e => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all"
                                        />
                                        <input 
                                            type="password" 
                                            placeholder="New Password"
                                            value={pwdData.newPassword}
                                            onChange={e => setPwdData({ ...pwdData, newPassword: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all"
                                        />
                                        <input 
                                            type="password" 
                                            placeholder="Confirm New Password"
                                            value={pwdData.confirmPassword}
                                            onChange={e => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all"
                                        />
                                        <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-xl transition-all">
                                            Update Password
                                        </button>
                                    </form>
                                </section>

                                <div className="h-px bg-slate-800/50"></div>

                                <section>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-xl font-black text-white mb-2">Two-Factor Authentication (2FA)</h2>
                                            <p className="text-sm text-slate-500">Protect your account with an extra layer of security.</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${twoFactor.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                                            {twoFactor.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>

                                    {!twoFactor.enabled && !twoFactor.qrCode && (
                                        <button onClick={handleSetup2FA} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl transition-all">
                                            Set up 2FA
                                        </button>
                                    )}

                                    {twoFactor.qrCode && (
                                        <div className="flex gap-8 items-center bg-slate-950 p-6 rounded-2xl border border-emerald-500/20 mt-4">
                                            <img src={twoFactor.qrCode} alt="2FA QR Code" className="w-40 h-40 rounded-lg p-2 bg-white" />
                                            <div className="space-y-4">
                                                <p className="text-sm text-slate-400">Scan this QR code in Google Authenticator or Authy, then enter the code below to verify.</p>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        maxLength={6}
                                                        placeholder="000000"
                                                        value={twoFactor.token}
                                                        onChange={e => setTwoFactor({ ...twoFactor, token: e.target.value })}
                                                        className="w-32 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.5em] focus:border-emerald-500 outline-none"
                                                    />
                                                    <button onClick={handleVerify2FA} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all">
                                                        Verify & Enable
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}

                        {activeTab === 'Notifications' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div>
                                    <h2 className="text-xl font-black text-white mb-2">Notification Preferences</h2>
                                    <p className="text-sm text-slate-500">Decide how and when we should contact you.</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { id: 'notifyOnScoreDrop', label: 'Score Drop Alerts', desc: 'Email me when a monitored site\'s SEO score drops significantly.' },
                                        { id: 'notifyWeekly', label: 'Weekly Summary', desc: 'Receive a weekly digest of your audit performance and wins.' }
                                    ].map(n => (
                                        <label key={n.id} className="flex items-start gap-4 p-6 rounded-2xl bg-slate-950 border border-slate-800/50 hover:bg-slate-900 transition-colors cursor-pointer group">
                                            <div className="relative inline-flex items-center cursor-pointer mt-1">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer"
                                                    checked={(notifData as any)[n.id]}
                                                    onChange={e => setNotifData({ ...notifData, [n.id]: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </div>
                                            <div>
                                                <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{n.label}</div>
                                                <div className="text-sm text-slate-500">{n.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <button 
                                    onClick={handleUpdateNotifications}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    Save Preferences
                                </button>
                            </div>
                        )}

                        {activeTab === 'Developer' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div>
                                    <h2 className="text-xl font-black text-white mb-2">API Keys</h2>
                                    <p className="text-sm text-slate-500">Programmatically access your audit data using API tokens.</p>
                                </div>

                                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Generate New Key</h3>
                                    <div className="flex gap-3">
                                        <input 
                                            type="text" 
                                            placeholder="Label (e.g. My Website Bot)"
                                            value={newKeyLabel}
                                            onChange={e => setNewKeyLabel(e.target.value)}
                                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all"
                                        />
                                        <button onClick={handleCreateApiKey} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 rounded-xl transition-all whitespace-nowrap">
                                            Create Key
                                        </button>
                                    </div>
                                    
                                    {generatedKey && (
                                        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                            <p className="text-xs font-bold text-emerald-400 mb-2">Make sure to copy this key now. You won't be able to see it again!</p>
                                            <div className="flex gap-2">
                                                <input readOnly value={generatedKey} className="flex-1 bg-black/50 border-none text-emerald-300 font-mono text-xs p-3 rounded-lg" />
                                                <button onClick={() => { navigator.clipboard.writeText(generatedKey); setMessage({ type: 'success', text: 'Copied to clipboard!' }); }} className="bg-emerald-500 text-white px-4 rounded-lg text-xs font-bold">Copy</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2">Active Keys</h3>
                                    {apiKeys.length === 0 ? (
                                        <div className="p-12 text-center text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">No active API keys found.</div>
                                    ) : (
                                        apiKeys.map(key => (
                                            <div key={key.id} className="flex justify-between items-center p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-all group">
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{key.label}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">Created {new Date(key.createdAt).toLocaleDateString()} • {key.lastUsed ? `Last used ${new Date(key.lastUsed).toLocaleDateString()}` : 'Never used'}</div>
                                                </div>
                                                <button 
                                                    onClick={() => handleRevokeKey(key.id)}
                                                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'Usage Stats' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div>
                                    <h2 className="text-xl font-black text-white mb-2">Usage Statistics</h2>
                                    <p className="text-sm text-slate-500">An overview of your SEO auditing activity.</p>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Total Audits', value: profile?.stats?.totalAudits || 0, icon: '📊', color: 'bg-blue-500' },
                                        { label: 'Avg SEO Score', value: `${profile?.stats?.avgScore || 0}%`, icon: '🎯', color: 'bg-emerald-500' },
                                        { label: 'Sites Monitored', value: '0', icon: '🌐', color: 'bg-purple-500' },
                                        { label: 'Account Tier', value: 'Pro', icon: '💎', color: 'bg-amber-500' }
                                    ].map(stat => (
                                        <div key={stat.label} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                                            <div className={`${stat.color} absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                                            <div className="text-2xl mb-2">{stat.icon}</div>
                                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
                                            <div className="text-2xl font-black text-white">{stat.value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
                                     <h3 className="text-lg font-black text-white mb-4">Optimization Progress</h3>
                                     <div className="h-40 flex items-end justify-between gap-2">
                                          {[40, 65, 55, 80, 75, 90, 85].map((h, i) => (
                                              <div key={i} className="flex-1 bg-emerald-500/20 rounded-t-lg relative group transition-all hover:bg-emerald-500/40" style={{ height: `${h}%` }}>
                                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{h}%</div>
                                              </div>
                                          ))}
                                     </div>
                                     <div className="flex justify-between text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-4 pl-2 pr-2">
                                          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                                     </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
