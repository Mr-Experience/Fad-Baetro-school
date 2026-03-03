import React from 'react';
import '../student/NoExamSchedule.css';
import './SchoolConfig.css';
import logo from '../../assets/logo.jpg';

const SchoolConfig = () => {
    return (
        <div className="sc-container">
            {/* Rich Header */}
            <header className="portal-header-bar sc-header">
                <div className="sc-header-left">
                    <img src={logo} alt="Logo" className="portal-logo-img" />
                    <h1 className="portal-school-name">Fad Mastro Academy</h1>
                </div>
                <div className="sc-header-right">
                    <div className="sc-session-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9D245A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <span>Current Session: 2023/2023 First Term Session</span>
                    </div>
                    <span className="sc-user-name">Olajire Daniel</span>
                    <div className="sc-avatar">
                        <img src="https://ui-avatars.com/api/?name=Olajire+Daniel&background=D1D5DB&color=9CA3AF" alt="Avatar" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="sc-main">
                <div className="sc-card">
                    <div className="sc-icon-circle">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </div>

                    <h2 className="sc-title">Set The Current Session</h2>
                    <p className="sc-subtitle">
                        Set the current session and term details which will control the data content of the admin and student
                    </p>

                    <div className="sc-form">
                        <div className="sc-select-wrap">
                            <select className="sc-select" defaultValue="2025/2026">
                                <option value="2025/2026">Session 2025/2026</option>
                                <option value="2024/2025">Session 2024/2025</option>
                            </select>
                            <div className="sc-select-arrow">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div className="sc-select-wrap">
                            <select className="sc-select" defaultValue="First Term">
                                <option value="First Term">First Term</option>
                                <option value="Second Term">Second Term</option>
                                <option value="Third Term">Third Term</option>
                            </select>
                            <div className="sc-select-arrow">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        <button className="sc-save-btn">Save Changes</button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SchoolConfig;
