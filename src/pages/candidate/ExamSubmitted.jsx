import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import logo from '../../assets/logo.jpg';

const ExamSubmitted = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { name } = location.state || { name: 'Candidate' };
    const [profileImage, setProfileImage] = useState(null);

    useEffect(() => {
        const fetchStudent = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: std } = await supabase
                    .from('students')
                    .select('profile_image')
                    .eq('email', user.email.toLowerCase())
                    .maybeSingle();
                if (std) setProfileImage(std.profile_image);
            }
        };
        fetchStudent();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/portal/candidate');
    };

    return (
        <div className="portal-login-container">
            <header className="portal-header-bar nes-header">
                <div className="nes-header-left">
                    <img src={logo} alt="Logo" className="portal-logo-img" />
                    <h1 className="portal-school-name">Candidate Portal</h1>
                </div>
                <div className="nes-header-right">
                    <span className="nes-user-name">{name}</span>
                    <div className="nes-avatar">
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="nes-profile-img" />
                        ) : (
                            <svg viewBox="0 0 36 36" fill="none" width="36" height="36">
                                <circle cx="18" cy="18" r="18" fill="#D1D5DB" />
                                <circle cx="18" cy="14" r="6" fill="#9CA3AF" />
                                <ellipse cx="18" cy="30" rx="10" ry="7" fill="#9CA3AF" />
                            </svg>
                        )}
                    </div>
                </div>
            </header>

            <main className="portal-content">
                <div className="login-card nes-card">
                    <div className="nes-icon-wrap" style={{ background: '#ecfdf5', borderColor: '#d1fae5' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                            stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>

                    <h2 className="nes-title">Exam Submitted</h2>
                    <p className="nes-subtitle">
                        Your entrance exam was submitted successfully, <strong>{name}</strong>.<br />
                        Please LOGOUT to finish your session.
                    </p>

                    <button className="nes-logout-btn" onClick={handleLogout}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ExamSubmitted;
