import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Settings, Users, UserPlus, LogOut, ChevronRight, Menu, X } from 'lucide-react';
import logoFallback from '../assets/logo.jpg';
import './SuperAdminLayout.css';

const SuperAdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/portal/superadmin');
                return;
            }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (!profileData || (profileData.role !== 'super_admin' && profileData.role !== 'super-admin')) {
                navigate('/portal/superadmin');
                return;
            }

            setProfile(profileData);
            setLoading(false);
        };

        checkAuth();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/portal/superadmin');
    };

    const navItems = [
        { label: 'School Config', path: '/portal/superadmin/config', icon: <Settings size={20} /> },
        { label: 'Manage Users', path: '/portal/superadmin/users', icon: <Users size={20} /> }
    ];

    if (loading) {
        return (
            <div className="sal-loading">
                <div className="sal-spinner"></div>
            </div>
        );
    }

    return (
        <div className="sal-layout">
            {/* Sidebar (Desktop) */}
            <aside className="sal-sidebar">
                <div className="sal-sidebar-header">
                    <img src={logoFallback} alt="Logo" className="sal-sidebar-logo" />
                    <div className="sal-sidebar-brand">
                        <h2>Master Admin</h2>
                        <span>Fad Mastro Academy</span>
                    </div>
                </div>

                <nav className="sal-sidebar-nav">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`sal-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                            <ChevronRight size={16} className="sal-nav-chevron" />
                        </Link>
                    ))}
                </nav>

                <div className="sal-sidebar-footer">
                    <div className="sal-user-badge">
                        <div className="sal-user-avatar">
                            {profile.full_name?.charAt(0) || 'S'}
                        </div>
                        <div className="sal-user-info">
                            <p className="sal-user-name">{profile.full_name}</p>
                            <p className="sal-user-email">{profile.email}</p>
                        </div>
                    </div>
                    <button className="sal-logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Top Bar (Mobile Only) */}
            <header className="sal-mobile-header">
                <img src={logoFallback} alt="Logo" className="sal-mobile-logo" />
                <button className="sal-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Mobile Nav Overlay */}
            {isMobileMenuOpen && (
                <div className="sal-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                    <nav className="sal-mobile-nav" onClick={e => e.stopPropagation()}>
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`sal-mobile-link ${location.pathname === item.path ? 'active' : ''}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        ))}
                        <button className="sal-mobile-logout" onClick={handleLogout}>
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </nav>
                </div>
            )}

            {/* Main Content Area */}
            <main className="sal-viewport">
                <div className="sal-content">
                    <Outlet context={{ profile }} />
                </div>
            </main>
        </div>
    );
};

export default SuperAdminLayout;
