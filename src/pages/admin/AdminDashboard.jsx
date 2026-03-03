import React, { useEffect, useState } from 'react';
import './AdminDashboard.css';
import logo from '../../assets/logo.jpg';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [userInitial, setUserInitial] = useState('A');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch profile from database
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, role, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (profile && profile.full_name) {
                    setUserName(profile.full_name);
                    setUserInitial(profile.full_name.charAt(0).toUpperCase());
                    if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
                } else {
                    // Fallback if profile not found
                    const fallbackName = user.email?.split('@')[0] || 'Admin';
                    setUserName(fallbackName);
                    setUserInitial(fallbackName.charAt(0).toUpperCase());
                }
            }
            setProfileLoading(false);
        };

        fetchUser();
    }, []);

    return (
        <div className="ad-container">
            {/* Sidebar */}
            <aside className="ad-sidebar">
                <nav className="ad-nav">
                    <div className="ad-nav-item active">
                        <div className="ad-nav-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                        </div>
                        <span>Dashboard</span>
                    </div>
                    <div className="ad-nav-item" onClick={() => navigate('/portal/admin/info')}>
                        <div className="ad-nav-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </div>
                        <span>Info</span>
                    </div>
                    <div className="ad-nav-item" onClick={() => navigate('/portal/admin/profile')}>
                        <div className="ad-nav-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <span>Profile</span>
                    </div>
                </nav>

                <div className="ad-nav-bottom">
                    <div className="ad-nav-item logout" onClick={async () => {
                        await supabase.auth.signOut();
                        navigate('/portal/admin/login');
                    }}>
                        <div className="ad-nav-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </div>
                        <span>Logout</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="ad-main">
                {/* Header */}
                <header className="ad-header">
                    <div className="ad-header-left">
                        <img src={logo} alt="Logo" className="ad-header-logo" />
                        <span className="ad-school-name">FAD MASTRO ACADEMY</span>
                    </div>
                    <div className="ad-header-right">
                        {profileLoading ? (
                            <div className="skeleton-pulse profile-name-skeleton" style={{ marginRight: '10px' }}></div>
                        ) : (
                            userName && <span className="ad-user-name" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>{userName}</span>
                        )}
                        <div className={`ad-user-avatar ${profileLoading ? 'skeleton-pulse avatar-skeleton' : ''}`}>
                            {!profileLoading && (
                                avatarUrl
                                    ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    : <span>{userInitial}</span>
                            )}
                        </div>
                    </div>
                </header>

                {/* Banner Section */}
                <section className="ad-banner">
                    <div className="ad-banner-overlay"></div>
                    <div className="ad-banner-content">
                        <h1>Welcome Back,</h1>
                        <p>Here's your updated overview</p>
                    </div>
                </section>

                {/* Overview Section */}
                <section className="ad-content-grid">
                    <div className="ad-overview-card full-width">
                        <div className="ad-card-header">
                            <h2>Students overview <span className="ad-trend">120% higher than last year ▲</span></h2>
                            <div className="ad-time-filter">
                                <span>Last 1 year</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div className="ad-stats-grid">
                            <div className="ad-stat-item">
                                <span className="ad-stat-label">Overall Students</span>
                                <div className="ad-stat-value-row">
                                    <span className="ad-stat-number">12,200</span>
                                    <span className="ad-stat-percent positive">+10%</span>
                                </div>
                            </div>
                            <div className="ad-stat-item">
                                <span className="ad-stat-label">New Admissions</span>
                                <div className="ad-stat-value-row">
                                    <span className="ad-stat-number">3,900</span>
                                    <span className="ad-stat-percent positive">+10%</span>
                                </div>
                            </div>
                            <div className="ad-stat-item">
                                <span className="ad-stat-label">Dropouts</span>
                                <div className="ad-stat-value-row">
                                    <span className="ad-stat-number">10</span>
                                    <span className="ad-stat-percent negative">-1.8%</span>
                                </div>
                            </div>
                            <div className="ad-stat-item">
                                <span className="ad-stat-label">Boys</span>
                                <div className="ad-stat-value-row">
                                    <span className="ad-stat-number">6,000</span>
                                </div>
                            </div>
                            <div className="ad-stat-item">
                                <span className="ad-stat-label">Girls</span>
                                <div className="ad-stat-value-row">
                                    <span className="ad-stat-number">6,200</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;
