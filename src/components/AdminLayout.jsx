import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminHeader from './AdminHeader';
import './AdminLayout.css';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // User Profile state
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState('');
    const [userInitial, setUserInitial] = useState('A');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUserId(user.id);
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url, role')
                    .eq('id', user.id)
                    .single();

                if (!profileError && profile) {
                    setUserName(profile.full_name || user.email?.split('@')[0]);
                    setUserInitial((profile.full_name || 'A').charAt(0).toUpperCase());
                    setAvatarUrl(profile.avatar_url);
                }
            }
            setProfileLoading(false);
        };
        fetchInitialData();
    }, []);

    const renderIcon = (type) => {
        switch (type) {
            case 'grid': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
            case 'info': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
            case 'user': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
            case 'users': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
            case 'questions': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
            default: return null;
        }
    };

    const navItems = [
        { label: 'Dashboard', path: '/portal/admin', icon: 'grid' },
        { label: 'Students', path: '/portal/admin/students', icon: 'users' },
        { label: 'Questions', path: '/portal/admin/questions', icon: 'questions' },
        { label: 'Info', path: '/portal/admin/info', icon: 'info' },
        { label: 'Profile', path: '/portal/admin/profile', icon: 'user' }
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/portal/admin/login');
    };

    return (
        <div className="ad-container">
            {/* Sidebar remains mounted across admin route changes */}
            <aside className="ad-sidebar">
                <nav className="ad-nav">
                    {navItems.map(item => (
                        <div
                            key={item.path}
                            className={`ad-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <div className="ad-nav-icon">{renderIcon(item.icon)}</div>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>
                <div className="ad-nav-bottom">
                    <div className="ad-nav-item logout" onClick={handleLogout}>
                        <div className="ad-nav-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </div>
                        <span>Logout</span>
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <main className="ad-main">
                {/* Header remains mounted across admin route changes */}
                <AdminHeader
                    profileLoading={profileLoading}
                    userName={userName}
                    userInitial={userInitial}
                    avatarUrl={avatarUrl}
                />

                {/* Individual pages render here - sharing profile context to prevent re-fetching */}
                <Outlet context={{
                    userName,
                    setUserName,
                    userInitial,
                    setUserInitial,
                    avatarUrl,
                    setAvatarUrl,
                    profileLoading,
                    userId
                }} />
            </main>
        </div>
    );
};

export default AdminLayout;
