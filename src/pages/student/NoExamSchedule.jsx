import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import logo from '../../assets/logo.jpg';

const NoExamSchedule = () => {
    const navigate = useNavigate();
    const [studentName, setStudentName] = useState('...');
    const [profileImage, setProfileImage] = useState(null);

    useEffect(() => {
        const getStudent = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/portal/student');
                return;
            }

            // Try fetching from students table
            let { data: student, error: fetchError } = await supabase
                .from('students')
                .select('full_name, profile_image, class_id')
                .eq('email', user.email.toLowerCase())
                .maybeSingle();

            // If fetching with profile_image fails (likely column doesn't exist yet), try just full_name
            if (fetchError && fetchError.code === 'PGRST204') {
                const { data: retryData, error: retryError } = await supabase
                    .from('students')
                    .select('full_name, class_id')
                    .eq('email', user.email.toLowerCase())
                    .maybeSingle();
                student = retryData;
                fetchError = retryError;
            }

            if (fetchError) {
                console.error("Identity Fetch Error Details:", fetchError);
            }

            if (student) {
                setStudentName(student.full_name);
                setProfileImage(student.profile_image || null);
            } else {
                setStudentName(user.user_metadata?.full_name || user.email);
            }

            // --- AUTO REDIRECT Logic ---
            // If an exam is active for this class, kick them to ActiveExam portal immediately
            if (student?.class_id) {
                const checkStatus = async () => {
                    const { data: active } = await supabase
                        .from('exam_configs')
                        .select('id')
                        .eq('class_id', student.class_id)
                        .eq('is_active', true)
                        .limit(1);

                    if (active && active.length > 0) {
                        navigate('/portal/student/active-exam');
                    }
                };

                checkStatus(); // Initial check
                const interval = setInterval(checkStatus, 5000); // Check every 5s
                return () => clearInterval(interval);
            }
        };
        getStudent();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/portal/student');
    };
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

                    {/* Text */}
                    <h2 className="nes-title">No active exam schedule</h2>
                    <p className="nes-subtitle">
                        You do not have any exam scheduled at the moment
                    </p>

                    {/* Logout button */}
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

export default NoExamSchedule;
