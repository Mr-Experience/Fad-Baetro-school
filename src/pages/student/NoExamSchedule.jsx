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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let intervalId;
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
                    setLoading(false);
                } else if (student) {
                    // Set name from database - check multiple possible column names
                    const displayName = student.full_name || student.name || user.user_metadata?.full_name || user.email;
                    setStudentName(displayName);

                    // Set profile image from database - check multiple possible column names
                    if (student.image_url) setProfileImage(student.image_url);
                    else if (student.profile_image) setProfileImage(student.profile_image);
                    else if (student.profile_picture) setProfileImage(student.profile_picture);
                    else if (student.avatar_url) setProfileImage(student.avatar_url);

                    console.log("✅ Student profile synced from database:", { name: displayName, hasImage: !!(student.image_url || student.profile_image || student.profile_picture || student.avatar_url) });

                    // --- AUTO REDIRECT Logic ---
                    // If an exam is active for this class, kick them to ActiveExam portal immediately
                    if (!student.class_id) {
                        setLoading(false);
                        return;
                    }

                    const checkExamStatus = async () => {
                        try {
                            const { data: sData } = await supabase
                                .from('system_settings')
                                .select('current_session, current_term')
                                .maybeSingle();

                            const curSession = sData?.current_session || '';
                            const curTerm = sData?.current_term || '';

                            const { data: activeConfigs, error: examError } = await supabase
                                .from('exam_configs')
                                .select('*')
                                .eq('class_id', student.class_id)
                                .eq('is_active', true);

                            if (!examError && activeConfigs && activeConfigs.length > 0) {
                                const { data: results } = await supabase
                                    .from('exam_results')
                                    .select('subject_id, question_type')
                                    .eq('student_id', student.id)
                                    .eq('session_id', curSession)
                                    .eq('term_id', curTerm);

                                const takenKeys = new Set(results?.map(r => `${r.subject_id}_${r.question_type}`) || []);
                                const availableExam = activeConfigs.find(c => {
                                    const notTaken = !takenKeys.has(`${c.subject_id}_${c.question_type}`);
                                    const examStartTime = c.visible_at ? new Date(c.visible_at).getTime() : 0;
                                    const examExpiryTime = examStartTime + (c.duration_minutes || 60) * 60 * 1000;
                                    const now = Date.now();

                                    const isTimeReady = !c.visible_at || now >= examStartTime;
                                    const isNotExpired = !c.visible_at || now < examExpiryTime;

                                    return notTaken && isTimeReady && isNotExpired;
                                });

                                if (availableExam) {
                                    navigate('/portal/student/active-exam');
                                    return;
                                }
                            }
                            setLoading(false);
                        } catch (e) {
                            console.error("Status check fail:", e);
                            setLoading(false);
                        }
                    };

                    checkExamStatus(); // Initial check
                    intervalId = setInterval(checkExamStatus, 1500); // Check every 1.5s

                } else {
                    // Fallback to auth metadata if no student record found
                    const fallbackName = user.user_metadata?.full_name || user.email;
                    setStudentName(fallbackName);
                    console.log("⚠️ No student record found in database, using auth metadata:", fallbackName);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error in getStudent:", error);
                setStudentName(user?.email || '...');
                setLoading(false);
            }
        };

        getStudent();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/portal/student');
    };

    if (loading) {
        return (
            <div className="portal-login-container" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <img src={logo} alt="School Logo" style={{ width: '100px', height: '100px', borderRadius: '50%', animation: 'pulse-load 1.5s ease-in-out infinite' }} />
                <style>{`
                    @keyframes pulse-load {
                        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(157, 36, 90, 0.4); }
                        70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(157, 36, 90, 0); }
                        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(157, 36, 90, 0); }
                    }
                `}</style>
            </div>
        );
    }

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
                            <span style={{ color: '#4B5563', fontWeight: 'bold', fontSize: '16px' }}>
                                {studentName ? studentName.charAt(0).toUpperCase() : 'S'}
                            </span>
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
