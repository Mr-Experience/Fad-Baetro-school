import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import logo from '../../assets/logo.jpg';

const ExamSubmitted = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { name, score } = location.state || { name: 'Student', score: null };
    const [hasMore, setHasMore] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const checkNext = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: std } = await supabase
                    .from('profiles')
                    .select('id, class_id')
                    .eq('email', user.email.toLowerCase())
                    .maybeSingle();

                if (!std || !std.class_id) return;

                const { data: sData } = await supabase
                    .from('system_settings')
                    .select('current_session, current_term')
                    .maybeSingle();

                const curSession = sData?.current_session || '';
                const curTerm = sData?.current_term || '';

                const { data: activeConfigs } = await supabase
                    .from('exam_configs')
                    .select('id, subject_id, question_type, visible_at, duration_minutes')
                    .eq('class_id', std.class_id)
                    .eq('is_active', true)
                    .eq('session_id', curSession)
                    .eq('term_id', curTerm);

                const now = Date.now();
                if (!activeConfigs || activeConfigs.length === 0) {
                    navigate('/portal/student/no-exam', { replace: true });
                    return;
                }

                // Filter to only non-expired ones
                const validConfigs = activeConfigs.filter(c => {
                    const start = c.visible_at ? new Date(c.visible_at).getTime() : 0;
                    const expiry = start + (c.duration_minutes || 60) * 60 * 1000;
                    return !c.visible_at || now < expiry;
                });

                if (validConfigs.length === 0) {
                    navigate('/portal/student/no-exam', { replace: true });
                    return;
                }

                const { data: results } = await supabase
                    .from('exam_results')
                    .select('exam_id, subject_id, question_type')
                    .eq('student_id', std.id)
                    .eq('session_id', curSession)
                    .eq('term_id', curTerm);

                const takenExamIds = new Set(results?.map(r => r.exam_id) || []);
                const takenKeys = new Set(results?.map(r => `${r.subject_id}_${r.question_type}`) || []);

                const more = validConfigs.some(c => !takenExamIds.has(c.id) && !takenKeys.has(`${c.subject_id}_${c.question_type}`));
                setHasMore(more);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        checkNext();
        const interval = setInterval(checkNext, 10000); // Check every 10s
        return () => clearInterval(interval);
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
                    <span className="nes-user-name">{name}</span>
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
                    {/* Success icon */}
                    <div className="nes-icon-wrap" style={{ background: '#dcfce7', borderColor: '#86efac' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                            stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>

                    <h2 className="nes-title">Exam Submitted!</h2>
                    <p className="nes-subtitle">
                        Great job, <strong>{name}</strong>!<br />
                        Your exam has been recorded successfully.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', width: '100%' }}>
                        {/* Remove Try Another Subject button as per request */}

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

                    {!loading && !hasMore && (
                        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '15px' }}>
                            You have completed all scheduled subjects for now.
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ExamSubmitted;
