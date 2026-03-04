import React from 'react';
import './AdminHeader.css';
import logo from '../assets/logo.jpg';

const AdminHeader = ({ profileLoading, userName, userInitial, avatarUrl }) => {
    return (
        <header className="ad-header">
            <div className="ad-header-left">
                <img src={logo} alt="Logo" className="ad-header-logo" />
                <span className="ad-school-name">FAD MASTRO ACADEMY</span>
            </div>
            <div className="ad-header-right">
                {profileLoading ? (
                    <div className="skeleton-pulse profile-name-skeleton" style={{ marginRight: '10px' }}></div>
                ) : (
                    userName && (
                        <span className="ad-user-name" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>
                            {userName}
                        </span>
                    )
                )}
                <div className={`ad-user-avatar ${profileLoading ? 'skeleton-pulse avatar-skeleton' : ''}`}>
                    {!profileLoading && (
                        avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="avatar"
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            <span>{userInitial}</span>
                        )
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
