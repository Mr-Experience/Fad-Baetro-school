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
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                console.error("Auth error or no user:", authError);
                navigate('/portal/student');
                return;
            }

            try {
                // Fetch student profile from database - try multiple column names for compatibility
                const { data: student, error: fetchError } = await supabase
                    .from('students')
                    .select('*')
                    .eq('email', user.email.toLowerCase())
                    .maybeSingle();

                if (fetchError) {
                    console.warn("Error fetching student profile:", fetchError.message);
                } else if (student) {
                    // Set name from database - check multiple possible column names
                    const displayName = student.full_name || student.name || user.user_metadata?.full_name || user.email;
                    setStudentName(displayName);

                    // Set profile image from database - check multiple possible column names
                    if (student.profile_image) {
                        setProfileImage(student.profile_image);
                    } else if (student.profile_picture) {
                        setProfileImage(student.profile_picture);
                    } else if (student.avatar_url) {
                        setProfileImage(student.avatar_url);
                    }

                    console.log("✅ Student profile synced from database:", { name: displayName, hasImage: !!(student.profile_image || student.profile_picture || student.avatar_url) });
                } else {
                    // Fallback to auth metadata if no student record found
                    const fallbackName = user.user_metadata?.full_name || user.email;
                    setStudentName(fallbackName);
                    console.log("⚠️ No student record found in database, using auth metadata:", fallbackName);
                }

                // --- AUTO REDIRECT Logic ---
                // If an exam is active for this class, kick them to ActiveExam portal immediately
                if (student?.class_id) {
                    const checkExamStatus = async () => {
                        const { data: active, error: examError } = await supabase
                            .from('exam_configs')
                            .select('id')
                            .eq('class_id', student.class_id)
                            .eq('is_active', true)
                            .limit(1);

                        if (!examError && active && active.length > 0) {
                            navigate('/portal/student/active-exam');
                        }
                    };

                    checkExamStatus(); // Initial check
                    const examInterval = setInterval(checkExamStatus, 5000); // Check every 5s
                    return () => clearInterval(examInterval);
                }
            } catch (error) {
                console.error("Error in getStudent:", error);
                setStudentName(user.email);
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
