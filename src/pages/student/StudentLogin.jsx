import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../auth/PortalLogin.css';
import { supabase } from '../../supabaseClient';
import logoFallback from '../../assets/logo.jpg';

const StudentLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Check if already logged in
    React.useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // If a student is already logged in, send them to where they should be
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, role')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (profile && profile.role === 'student') {
                    navigate('/portal/student/no-exam'); // Correct fallback
                    return;
                }
            }
        };
        checkSession();
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            // FETCH ALL CONTEXT IN PARALLEL FOR SPEED
            const [profileRes, settingsRes] = await Promise.all([
                supabase.from('profiles').select('id, class_id').eq('id', data.user.id).eq('role', 'student').maybeSingle(),
                supabase.from('system_settings').select('current_session, current_term').eq('id', 1).single()
            ]);

            const student = profileRes.data;
            const settings = settingsRes.data;

            if (!student) {
                await supabase.auth.signOut();
                setError('Unauthorized: This portal is for students only.');
                setLoading(false);
                return;
            }

            const activeSession = (settings?.current_session || '').trim();
            const activeTerm = (settings?.current_term || '').trim();

            if (student.class_id) {
                // Check for JSS 3 "Break"
                const { data: classCheck } = await supabase.from('classes').select('class_name').eq('id', student.class_id).maybeSingle();
                if (classCheck?.class_name === 'JSS 3') {
                    navigate('/portal/student/department-selection');
                    return;
                }

                const { data: activeExams } = await supabase
                    .from('active_exams')
                    .select('*, exam_configs!inner(*)')
                    .eq('exam_configs.class_id', student.class_id)
                    .eq('is_active', true);
                    
                const sessionExams = activeExams?.filter(ae => ae.session_id === activeSession && ae.term_id === activeTerm) || [];

                if (sessionExams.length > 0) {
                    const { data: results } = await supabase
                        .from('exam_results')
                        .select('exam_id, subject_id, question_type')
                        .eq('student_id', student.id)
                        .eq('session_id', activeSession)
                        .eq('term_id', activeTerm);

                    const takenExamIds = new Set(results?.map(r => r.exam_id) || []);
                    const takenKeys = new Set(results?.map(r => `${r.subject_id}_${r.question_type}`) || []);

                    const nowTime = new Date().getTime();
                    const readyExams = sessionExams.filter(ae => {
                        const cfg = ae.exam_configs;
                        const notTaken = !takenExamIds.has(cfg.id) && !takenKeys.has(`${cfg.subject_id}_${cfg.question_type}`);
                        const examStartTime = ae.visible_at ? new Date(ae.visible_at).getTime() : 0;
                        const examExpiryTime = examStartTime + (cfg.duration_minutes || 60) * 60 * 1000;

                        const isReady = !ae.visible_at || nowTime >= examStartTime;
                        const isNotExpired = !ae.visible_at || nowTime < examExpiryTime;
                        return notTaken && isReady && isNotExpired;
                    });

                    if (readyExams.length > 0) {
                        navigate('/portal/student/active-exam');
                        return;
                    } else if (sessionExams.length > 0) {
                        const anyUntaken = sessionExams.some(ae => {
                            const cfg = ae.exam_configs;
                            return !takenExamIds.has(cfg.id) && !takenKeys.has(`${cfg.subject_id}_${cfg.question_type}`);
                        });
                        if (!anyUntaken) {
                            navigate('/portal/student/submitted', { replace: true });
                            return;
                        }
                    }
                }
            }

            // Default to no-exam if nothing configured at all
            navigate('/portal/student/no-exam');
        }
    };

    return (
        <div className="portal-login-container">
            <header className="portal-header-bar">
                <img
                    src={logoFallback}
                    alt="Logo"
                    className="portal-logo-img"
                />
                <h1 className="portal-school-name">Fad Maestro Academy</h1>
            </header>

            <main className="portal-content">
                <div className="login-card">
                    <h2 className="login-title">Login to student portal</h2>
                    <p className="login-subtitle">Access your classes, exams and results.</p>

                    {error && <div style={{ color: 'red', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

                    <form className="login-form" onSubmit={handleLogin} autoComplete="off">
                        <div className="form-group">
                            <label className="form-label">Email*</label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="off"
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password*</label>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                className="form-input"
                                required
                            />
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login to portal'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default StudentLogin;
