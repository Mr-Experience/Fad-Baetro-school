import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import logo from '../../assets/logo.jpg';

const NoExamSchedule = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState(sessionStorage.getItem('fad_cand_name') || '...');
    const [profileImage, setProfileImage] = useState(sessionStorage.getItem('fad_cand_avatar') || null);
    const [loading, setLoading] = useState(!sessionStorage.getItem('fad_cand_name'));

    useEffect(() => {
        let intervalId;
        const getCandidate = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) {
                    navigate('/portal/candidate');
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, full_name, profile_image, image_url')
                    .eq('id', user.id)
                    .maybeSingle();

                let candidateId = user.id;

                if (profile) {
                    setUserName(profile.full_name);
                    const avatar = profile.image_url || profile.profile_image || profile.avatar_url;
                    setProfileImage(avatar);
                    candidateId = profile.id;

                    // Cache for zero flicker
                    sessionStorage.setItem('fad_cand_name', profile.full_name || '');
                    if (avatar) sessionStorage.setItem('fad_cand_avatar', avatar);
                } else {
                    const fallback = user.user_metadata?.full_name || user.email;
                    setUserName(fallback);
                    sessionStorage.setItem('fad_cand_name', fallback || '');
                }

                // --- AUTO REDIRECT Logic ---
                const checkStatus = async () => {
                    try {
                        const { data: sData } = await supabase
                            .from('system_settings')
                            .select('current_session, current_term')
                            .maybeSingle();

                        const curSession = (sData?.current_session || '').trim();
                        const curTerm = (sData?.current_term || '').trim();
                        const { data: activeExams } = await supabase
                            .from('active_exams')
                            .select('*, exam_configs!inner(*)')
                            .eq('exam_configs.question_type', 'candidate')
                            .eq('is_active', true)
                            .eq('session_id', curSession)
                            .eq('term_id', curTerm);

                        if (activeExams && activeExams.length > 0) {
                            const { data: results } = await supabase
                                .from('exam_results')
                                .select('subject_id')
                                .eq('student_id', candidateId)
                                .eq('session_id', curSession)
                                .eq('term_id', curTerm)
                                .eq('question_type', 'candidate');

                            const takenSubjects = new Set(results?.map(r => r.subject_id) || []);
                            const availableExam = activeExams.find(ae => {
                                const cfg = ae.exam_configs;
                                const notTaken = !takenSubjects.has(cfg.subject_id);
                                const examStartTime = ae.visible_at ? new Date(ae.visible_at).getTime() : 0;
                                const examExpiryTime = examStartTime + (cfg.duration_minutes || 60) * 60 * 1000;
                                const now = Date.now();

                                const isTimeReady = !ae.visible_at || now >= examStartTime;
                                const isNotExpired = !ae.visible_at || now < examExpiryTime;

                                return notTaken && isTimeReady && isNotExpired;
                            });

                            if (availableExam) {
                                if (intervalId) clearInterval(intervalId);
                                navigate('/portal/candidate/active-exam');
                                return;
                            }
                        }

                        setLoading(false);
                        if (intervalId) clearInterval(intervalId);
                        navigate('/portal/candidate/no-exam');
                    } catch (e) {
                        console.error("Status check fail:", e);
                        setLoading(false);
                    }
                };

                checkStatus();
                intervalId = setInterval(checkStatus, 1500);

            } catch (error) {
                console.error("Error in getCandidate:", error);
                setLoading(false);
            }
        };

        getCandidate();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/portal/candidate');
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
                    <h1 className="portal-school-name">Fad Maestro Academy</h1>
                </div>
                <div className="nes-header-right">
                    <div className="ad-user-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '13px' }}>
                        <span className="nes-user-name" style={{ marginRight: 0 }}>{userName}</span>
                    </div>
                    <div className="nes-avatar">
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="nes-profile-img" />
                        ) : (
                            <span style={{ color: '#4B5563', fontWeight: 'bold', fontSize: '16px' }}>
                                {userName ? userName.charAt(0).toUpperCase() : 'C'}
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
