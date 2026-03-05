import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import './ActiveExam.css';
import logo from '../../assets/logo.jpg';

const ActiveExam = () => {
    const navigate = useNavigate();
    const [candidateName, setCandidateName] = useState('...');
    const [profileImage, setProfileImage] = useState(null);
    const [activeExam, setActiveExam] = useState(null);

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/portal/candidate');
                return;
            }

            // 1. Fetch Candidate Identity
            // Candidates are often in the students table with a specific class
            let { data: student, error: fetchError } = await supabase
                .from('students')
                .select('full_name, profile_image, class_id')
                .eq('email', user.email.toLowerCase())
                .maybeSingle();

            if (student) {
                setCandidateName(student.full_name);
                setProfileImage(student.profile_image || null);

                // 2. Initial Fetch for Active Candidate Exam
                const fetchActive = async () => {
                    const { data, error } = await supabase
                        .from('exam_configs')
                        .select('*, subjects(subject_name)')
                        .eq('class_id', student.class_id)
                        .eq('question_type', 'candidate')
                        .eq('is_active', true)
                        .limit(1)
                        .maybeSingle();

                    if (!error && data) {
                        setActiveExam(data);
                    } else if (!data) {
                        navigate('/portal/candidate/no-exam');
                    }
                };

                fetchActive();
                const interval = setInterval(fetchActive, 5000);
                return () => clearInterval(interval);
            } else {
                // If not in students table, fallback to metadata
                setCandidateName(user.user_metadata?.full_name || user.email);
            }
        };
        getData();
    }, [navigate]);

    return (
        <div className="portal-login-container">
            <header className="portal-header-bar nes-header">
                <div className="nes-header-left">
                    <img src={logo} alt="Logo" className="portal-logo-img" />
                    <h1 className="portal-school-name">Fad Mastro Academy</h1>
                </div>
                <div className="nes-header-right">
                    <span className="nes-user-name">{candidateName}</span>
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
                <div className="login-card ae-card">
                    <div className="ae-icon-wrap">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                            stroke="#9D245A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <line x1="9" y1="7" x2="15" y2="7" />
                            <line x1="9" y1="11" x2="12" y2="11" />
                        </svg>
                    </div>

                    <h2 className="ae-subject">{activeExam?.subjects?.subject_name || 'Loading instructions...'}</h2>

                    <p className="ae-instructions-heading">Read the following instructions carefully:</p>
                    <ul className="ae-instructions-list">
                        <li>Read each question carefully; only one option is correct</li>
                        <li>Do not refresh or close the browser during the exam.</li>
                        <li>You can review and change answers before submission.</li>
                        <li>Click Submit only when finished; submission is final.</li>
                        <li>The exam auto-submits when time expires.</li>
                    </ul>

                    <button
                        className="login-btn ae-start-btn"
                        onClick={() => navigate('/portal/candidate/exam')}
                        disabled={!activeExam}
                    >
                        Start now
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ActiveExam;
