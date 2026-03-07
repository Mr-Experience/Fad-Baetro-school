import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logoFallback from '../assets/logo.jpg';
import './AdminHeader.css';

const AdminHeader = ({ profileLoading, userName, userInitial, avatarUrl, activeSession, activeTerm }) => {
    const [dbLogo, setDbLogo] = React.useState(null);

    React.useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('system_settings').select('school_logo_url').eq('id', 1).maybeSingle(); // Corrected line
            if (data?.school_logo_url && data.school_logo_url.startsWith('http') && !data.school_logo_url.includes('YOUR_DIRECT_PUBLIC')) {
                setDbLogo(data.school_logo_url);
            }
        };
        fetchSettings();
    }, []);

    return (
        <header className="ad-header">
            <div className="ad-header-left">
                <Link to="/portal/admin">
                    <img src={dbLogo || logoFallback} alt="Logo" className="ad-header-logo" />
                </Link>
            </div>
            <div className="ad-header-right">
                <div className="ad-header-actions">
                    {activeSession && (
                        <div className="ad-session-badge">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9D245A" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                            </svg>
                            <span>Current Session: {activeSession} {activeTerm} Session</span>
                        </div>
                    )}

                    <span className="ad-user-name-text">{userName}</span>
                    <div className={`ad-user-avatar ${profileLoading ? 'skeleton-pulse avatar-skeleton' : ''}`}>
                        {!profileLoading && (
                            avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="avatar"
                                    className="ad-avatar-img"
                                />
                            ) : (
                                <span>{userInitial}</span>
                            )
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
