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
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: std } = await supabase
                    .from('profiles')
                    .select('id, profile_image, class_id')
                    .eq('email', user.email.toLowerCase())
                    .maybeSingle();

                if (std) {
                    setProfileImage(std.profile_image);

                    const { data: sData } = await supabase
                        .from('system_settings')
                        .select('current_session, current_term')
                        .maybeSingle();

                    const curSession = sData?.current_session || '';
                    const curTerm = sData?.current_term || '';

                    const { data: activeConfigs } = await supabase
                        .from('exam_configs')
                        .select('id, subject_id, visible_at, duration_minutes')
                        .eq('class_id', std.class_id)
                        .eq('question_type', 'candidate')
                        .eq('is_active', true)
                        .eq('session_id', curSession)
                        .eq('term_id', curTerm);

                    const now = Date.now();
                    if (!activeConfigs || activeConfigs.length === 0) {
                        setHasMore(false);
                        setLoading(false);
                        return;
                    }

                    // Filter to only non-expired ones
                    const validConfigs = activeConfigs.filter(c => {
                        const start = c.visible_at ? new Date(c.visible_at).getTime() : 0;
                        const expiry = start + (c.duration_minutes || 60) * 60 * 1000;
                        return !c.visible_at || now < expiry;
                    });

                    if (validConfigs.length === 0) {
                        navigate('/portal/candidate/no-exam', { replace: true });
                        return;
                    }

                    const { data: results } = await supabase
                        .from('exam_results')
                        .select('exam_id, subject_id')
                        .eq('student_id', std.id)
                        .eq('session_id', curSession)
                        .eq('term_id', curTerm)
                        .eq('question_type', 'candidate');

                    const takenExamIds = new Set(results?.map(r => r.exam_id) || []);
                    const takenKeys = new Set(results?.map(r => `${r.subject_id}_candidate`) || []);

                    const more = validConfigs.some(c => !takenExamIds.has(c.id) && !takenKeys.has(`${c.subject_id}_candidate`));
                    setHasMore(more);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
        const interval = setInterval(fetchStudent, 10000);
        return () => clearInterval(interval);
    }, [navigate]);

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
                        {hasMore ? "You have more subjects scheduled." : "All subjects for today are complete."}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', width: '100%' }}>
                        {!loading && hasMore && (
                            <button
                                className="login-btn"
                                style={{ background: '#9D245A', color: 'white' }}
                                onClick={() => navigate('/portal/candidate/active-exam')}
                            >
                                Take Next Subject
                            </button>
                        )}

                        <button className="nes-logout-btn" onClick={handleLogout} style={{ width: '100%' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ExamSubmitted;
