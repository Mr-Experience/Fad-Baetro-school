import React from 'react';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import logo from '../../assets/logo.jpg';

const ExamSubmitted = () => {
    return (
        <div className="portal-login-container">
            {/* Header */}
            <header className="portal-header-bar nes-header">
                <div className="nes-header-left">
                    <img src={logo} alt="Logo" className="portal-logo-img" />
                    <h1 className="portal-school-name">Fad Mastro Academy</h1>
                </div>
                <div className="nes-header-right">
                    <span className="nes-user-name">Olajire Daniel</span>
                    <div className="nes-avatar">
                        <svg viewBox="0 0 36 36" fill="none" width="36" height="36">
                            <circle cx="18" cy="18" r="18" fill="#D1D5DB" />
                            <circle cx="18" cy="14" r="6" fill="#9CA3AF" />
                            <ellipse cx="18" cy="30" rx="10" ry="7" fill="#9CA3AF" />
                        </svg>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="portal-content">
                <div className="login-card nes-card">
                    {/* Info icon */}
                    <div className="nes-icon-wrap">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                            stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="8" strokeWidth="2.5" />
                            <line x1="12" y1="12" x2="12" y2="16" />
                        </svg>
                    </div>

                    <h2 className="nes-title">Exam Submitted</h2>
                    <p className="nes-subtitle">
                        Your exam submitted successfully Olajire Daniel,<br />
                        please LOGOUT
                    </p>

                    <button className="nes-logout-btn">
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
