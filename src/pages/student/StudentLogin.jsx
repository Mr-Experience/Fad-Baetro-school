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
            // 1. Verify existence in students table (STRICT ROLE CHECK)
            const { data: student } = await supabase
                .from('students')
                .select('id, class_id')
                .eq('id', data.user.id)
                .maybeSingle();

            if (!student) {
                await supabase.auth.signOut();
                setError('Unauthorized: This portal is for students only.');
                setLoading(false);
                return;
            }

            // 2. FETCH GLOBAL SESSION CONTEXT (Step 1)
            const { data: settings } = await supabase
                .from('system_settings')
                .select('current_session, current_term')
                .eq('id', 1)
                .single();

            const activeSession = settings?.current_session || '';
            const activeTerm = settings?.current_term || '';

            if (student.class_id) {
                // 3. DETERMINE ACTIVE EXAM (via separate Active Table)
                const { data: activeExams } = await supabase
                    .from('active_exams')
                    .select('*, exam_configs!inner(*)')
                    .eq('exam_configs.class_id', student.class_id)
                    .eq('session_id', activeSession)
                    .eq('term_id', activeTerm)
                    .eq('is_active', true);

                if (activeExams && activeExams.length > 0) {
                    const { data: results } = await supabase
                        .from('exam_results')
                        .select('exam_id, subject_id, question_type')
                        .eq('student_id', student.id)
                        .eq('session_id', activeSession)
                        .eq('term_id', activeTerm);

                    const takenExamIds = new Set(results?.map(r => r.exam_id) || []);
                    const takenKeys = new Set(results?.map(r => `${r.subject_id}_${r.question_type}`) || []);

                    const nowTime = new Date().getTime();
                    const readyExams = activeExams.filter(ae => {
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
                    } else if (activeExams.length > 0) {
                        const anyUntaken = activeExams.some(ae => {
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
