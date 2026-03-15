import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import logo from '../../assets/logo.jpg';

const NoExamSchedule = () => {
    const navigate = useNavigate();
    const [studentName, setStudentName] = useState(sessionStorage.getItem('fad_std_name') || '...');
    const [profileImage, setProfileImage] = useState(sessionStorage.getItem('fad_std_avatar') || null);
    const [loading, setLoading] = useState(!sessionStorage.getItem('fad_std_name'));
    const [isExpired, setIsExpired] = useState(false);

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
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (fetchError) {
                    console.warn("Error fetching student profile:", fetchError.message);
                    setLoading(false);
                } else if (student) {
                    // Set name from database - check multiple possible column names
                    const displayName = student.full_name || student.name || user.user_metadata?.full_name || user.email;
                    setStudentName(displayName);

                    const avatar = student.image_url || student.profile_image || student.profile_picture || student.avatar_url;
                    setProfileImage(avatar);

                    // Cache for zero flicker
                    sessionStorage.setItem('fad_std_name', displayName || '');
                    if (avatar) sessionStorage.setItem('fad_std_avatar', avatar);

                    console.log("✅ Student profile synced from database:", { name: displayName, hasImage: !!avatar });

                    // --- AUTO REDIRECT Logic ---
                    // If an exam is active for this class, kick them to ActiveExam portal immediately
                    if (!student.class_id) {
                        setLoading(false);
                        return;
                    }

                    const checkExamStatus = async () => {
                        try {
                            const [settingsRes, examsRes] = await Promise.all([
                                supabase.from('system_settings').select('current_session, current_term').maybeSingle(),
                                supabase.from('active_exams').select('*, exam_configs!inner(*)').eq('exam_configs.class_id', student.class_id).eq('is_active', true)
                            ]);

                            const curSession = (settingsRes.data?.current_session || '').trim();
                            const curTerm = (settingsRes.data?.current_term || '').trim();
                            const activeExams = examsRes.data?.filter(ae => ae.session_id === curSession && ae.term_id === curTerm) || [];

                            if (activeExams.length > 0) {
                                const { data: results } = await supabase
                                    .from('exam_results')
                                    .select('subject_id, question_type')
                                    .eq('student_id', student.id)
                                    .eq('session_id', curSession)
                                    .eq('term_id', curTerm);

                                const takenKeys = new Set(results?.map(r => `${r.subject_id}_${r.question_type}`) || []);
                                const availableExam = activeExams.find(ae => {
                                    const cfg = ae.exam_configs;
                                    const notTaken = !takenKeys.has(`${cfg.subject_id}_${cfg.question_type}`);
                                    const examStartTime = ae.visible_at ? new Date(ae.visible_at).getTime() : 0;
                                    const examExpiryTime = examStartTime + (cfg.duration_minutes || 60) * 60 * 1000;
                                    const now = Date.now();

                                    const isTimeReady = !ae.visible_at || now >= examStartTime;
                                    const isNotExpired = !ae.visible_at || now < examExpiryTime;

                                    return notTaken && isTimeReady && isNotExpired;
                                });

                                if (availableExam) {
                                    if (intervalId) clearInterval(intervalId);
                                    navigate('/portal/student/active-exam');
                                    return;
                                } else {
                                    const anyExpired = activeExams.some(ae => {
                                        const cfg = ae.exam_configs;
                                        const now = Date.now();
                                        const startTime = ae.visible_at ? new Date(ae.visible_at).getTime() : 0;
                                        const expiryTime = startTime + (cfg.duration_minutes || 60) * 60 * 1000;
                                        return now >= expiryTime;
                                    });
                                    setIsExpired(anyExpired);
                                }
                            } else {
                                setIsExpired(false);
                            }
                            setLoading(false);
                        } catch (e) {
                            console.error("Status check fail:", e);
                            setLoading(false);
                        }
                    };

                    checkExamStatus(); // Initial check
                    intervalId = setInterval(checkExamStatus, 15000 + (Math.random() * 5000)); 

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

    const renderHeader = () => (
        <header className="portal-header-bar nes-header">
            <div className="nes-header-left">
                <img src={logo} alt="Logo" className="portal-logo-img" />
                <h1 className="portal-school-name">Fad Maestro Academy</h1>
            </div>
            <div className="nes-header-right">
                <div className="ad-user-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '13px' }}>
                    <span className="nes-user-name" style={{ marginRight: 0 }}>{studentName}</span>
                </div>
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
    );

    if (loading) {
        return (
            <div className="portal-login-container">
                {renderHeader()}
                <main className="portal-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="qe-spinner" style={{ width: '40px', height: '40px', borderTopColor: '#9D245A' }}></div>
                </main>
            </div>
        );
    }

    return (
        <div className="portal-login-container">
            {/* Header */}
            {renderHeader()}

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
                    <h2 className="nes-title">
                        {isExpired ? 'Exam Session Closed' : 'No active exam schedule'}
                    </h2>
                    <p className="nes-subtitle">
                        {isExpired
                            ? 'The scheduled time for your exam has passed. Contact admin if you missed it.'
                            : 'You do not have any exam scheduled at the moment'}
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
