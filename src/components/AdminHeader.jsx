import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut } from 'lucide-react';
import logoFallback from '../assets/logo.jpg';
import './AdminHeader.css';

const AdminHeader = ({ profileLoading, userName, userRole, userInitial, avatarUrl, activeSession, activeTerm, onLogout }) => {
    // Format role for display
    const displayRole = userRole?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '...';

    return (
        <header className="ad-header">
            <div className="ad-header-left">
                <Link to="/portal/admin">
                    <img
                        src={logoFallback}
                        alt="Logo"
                        className="ad-header-logo"
                    />
                </Link>
            </div>
            <div className="ad-header-right">
                <div className="ad-header-actions">
                    <div className="ad-session-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9D245A" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                        <span>{activeSession ? `Session: ${activeSession} ${activeTerm}` : 'Loading Session...'}</span>
                    </div>

                    <div className="ad-user-info-group">
                        <div className="ad-user-meta">
                            <span className="ad-user-name-text">{userName}</span>
                        </div>
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
                    {onLogout && (
                        <button className="ad-logout-btn" onClick={onLogout} title="Logout">
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
