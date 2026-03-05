import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import './ActiveExam.css';
import logo from '../../assets/logo.jpg';

const ActiveExam = () => {
    const navigate = useNavigate();
    const [studentName, setStudentName] = useState('...');
    const [profileImage, setProfileImage] = useState(null);
    const [activeExam, setActiveExam] = useState(null);

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/portal/student');
                return;
            }

            // 1. Fetch Student Identity & Class
            let { data: student, error: fetchError } = await supabase
                .from('students')
                .select('full_name, profile_image, class_id')
                .eq('email', user.email.toLowerCase())
                .maybeSingle();

            if (fetchError && fetchError.code === 'PGRST204') {
                const { data: retryData, error: retryError } = await supabase
                    .from('students')
                    .select('full_name, class_id')
                    .eq('email', user.email.toLowerCase())
                    .maybeSingle();
                student = retryData;
                fetchError = retryError;
            }

            if (student) {
                setStudentName(student.full_name);
                setProfileImage(student.profile_image || null);

                // 2. Initial Fetch for Active Exam for this class
                const fetchActive = async () => {
                    const { data, error } = await supabase
                        .from('exam_configs')
                        .select('*, subjects(subject_name)')
                        .eq('class_id', student.class_id)
                        .eq('is_active', true)
                        .limit(1)
                        .maybeSingle();

                    if (!error && data) {
                        setActiveExam(data);
                    } else if (!data) {
                        // If no exam found, redirect out
                        navigate('/portal/student/no-exam');
                    }
                };

                fetchActive();

                // 3. Set up polling to catch deactivation (Reduced to 5s for faster response)
                const interval = setInterval(fetchActive, 5000);
                return () => clearInterval(interval);
            }
        };
        getData();
    }, [navigate]);

    return (
        <div className="portal-login-container">
            {/* Header */}
            <header className="portal-header-bar nes-header">
                <div className="nes-header-left">
                    <img src={logo} alt="Logo" className="portal-logo-img" />
                    <h1 className="portal-school-name">Fad Mastro Academy</h1>
                </div>
                <div className="nes-header-right">
                    <span className="nes-user-name">{studentName}</span>
                    <div className="nes-avatar">
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="nes-profile-img" />
                        ) : (
                            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
                                <circle cx="18" cy="18" r="18" fill="#D1D5DB" />
                                <circle cx="18" cy="14" r="6" fill="#9CA3AF" />
                                <ellipse cx="18" cy="30" rx="10" ry="7" fill="#9CA3AF" />
                            </svg>
                        )}
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="portal-content">
                <div className="login-card ae-card">

                    {/* Subject icon */}
                    <div className="ae-icon-wrap">
                        {/* Book stack icon */}
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                            stroke="#9D245A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <line x1="9" y1="7" x2="15" y2="7" />
                            <line x1="9" y1="11" x2="12" y2="11" />
                        </svg>
                    </div>

                    {/* Subject name */}
                    <h2 className="ae-subject">{activeExam?.subjects?.subject_name || 'Loading exam...'}</h2>

                    {/* Instructions */}
                    <p className="ae-instructions-heading">Read the following instructions carefully:</p>
                    <ul className="ae-instructions-list">
                        <li>Read each question carefully; only one option is correct</li>
                        <li>Do not refresh or close the browser during the exam.</li>
                        <li>You can review and change answers before submission.</li>
                        <li>Click Submit only when finished; submission is final.</li>
                        <li>The exam auto-submits when time expires.</li>
                    </ul>

                    {/* Start button */}
                    <button
                        className="login-btn ae-start-btn"
                        onClick={() => navigate('/portal/student/exam')}
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
