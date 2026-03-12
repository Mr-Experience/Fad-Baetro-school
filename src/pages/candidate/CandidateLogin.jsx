import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../auth/PortalLogin.css';
import './CandidateLogin.css';
import { supabase } from '../../supabaseClient';
import logoFallback from '../../assets/logo.jpg';

const CandidateLogin = () => {
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
                // If a candidate is already logged in, send them to their dashboard
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, role')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (profile && profile.role === 'candidate') {
                    navigate('/portal/candidate/no-exam'); // Correct fallback
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
            // 1. Fetch System Context
            const { data: settings } = await supabase
                .from('system_settings')
                .select('current_session, current_term')
                .eq('id', 1)
                .single();

            const curSession = settings?.current_session || '';
            const curTerm = settings?.current_term || '';

            // 2. Fetch identity and check role
            let { data: identity } = await supabase
                .from('profiles')
                .select('id, class_id, role')
                .eq('id', data.user.id)
                .maybeSingle();

            if (!identity || identity.role !== 'candidate') {
                await supabase.auth.signOut();
                setError('Unauthorized: This portal is for candidates only.');
                setLoading(false);
                return;
            }

            // Check if candidate is DEACTIVATED
            const { data: candidateData } = await supabase
                .from('candidates')
                .select('status')
                .eq('id', identity.id)
                .maybeSingle();

            if (candidateData?.status === 'deactivated') {
                await supabase.auth.signOut();
                setError('Your candidate portal access has been deactivated. Please contact the administrator.');
                setLoading(false);
                return;
            }

            // 3. Check for ACTIVE candidate exams
            const { data: activeExams } = await supabase
                .from('active_exams')
                .select('*, exam_configs!inner(*)')
                .eq('exam_configs.question_type', 'candidate')
                .eq('is_active', true)
                .eq('session_id', curSession)
                .eq('term_id', curTerm);

            if (activeExams && activeExams.length > 0) {
                // Check if already taken
                const { data: results } = await supabase
                    .from('exam_results')
                    .select('exam_id, subject_id')
                    .eq('student_id', identity?.id || data.user.id)
                    .eq('session_id', curSession)
                    .eq('term_id', curTerm)
                    .eq('question_type', 'candidate');

                const takenExamIds = new Set(results?.map(r => r.exam_id) || []);
                const takenSubjects = new Set(results?.map(r => r.subject_id) || []);

                const nowTime = new Date().getTime();
                const readyExams = activeExams.filter(ae => {
                    const cfg = ae.exam_configs;
                    const notTaken = !takenExamIds.has(cfg.id) && !takenSubjects.has(cfg.subject_id);
                    const examStartTime = ae.visible_at ? new Date(ae.visible_at).getTime() : 0;
                    const examExpiryTime = examStartTime + (cfg.duration_minutes || 60) * 60 * 1000;

                    const isReady = !ae.visible_at || nowTime >= examStartTime;
                    const isNotExpired = !ae.visible_at || nowTime < examExpiryTime;
                    return notTaken && isReady && isNotExpired;
                });

                if (readyExams.length > 0) {
                    navigate('/portal/candidate/active-exam');
                    return;
                } else if (activeExams.length > 0) {
                    const anyUntaken = activeExams.some(ae => {
                        const cfg = ae.exam_configs;
                        return !takenExamIds.has(cfg.id) && !takenSubjects.has(cfg.subject_id);
                    });
                    if (!anyUntaken) {
                        navigate('/portal/candidate/submitted', { replace: true });
                        return;
                    }
                }
            }

            // Default to no-exam
            navigate('/portal/candidate/no-exam');
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
                    <h2 className="login-title">Login to candidate portal</h2>

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

                        <a href="#reset" className="forgot-password-link">Reset Password</a>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login to portal'}
                        </button>
                        <p className="signup-prompt" style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#64748B' }}>
                            New candidate? <Link to="/signup" style={{ color: '#4F46E5', fontWeight: 'bold', textDecoration: 'none' }}>Start Admission Application</Link>
                        </p>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CandidateLogin;

