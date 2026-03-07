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
    const [dbLogo, setDbLogo] = useState(null);

    React.useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('system_settings').select('school_logo_url').eq('id', 1).maybeSingle();
            if (data?.school_logo_url && data.school_logo_url.startsWith('http') && !data.school_logo_url.includes('YOUR_DIRECT_PUBLIC')) {
                setDbLogo(data.school_logo_url);
            }
        };
        fetchSettings();
    }, []);

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

            // 2. Fetch identity (Check students first, then candidates)
            let { data: identity } = await supabase
                .from('students')
                .select('id, class_id')
                .eq('email', email.toLowerCase())
                .maybeSingle();

            if (!identity) {
                const { data: cand } = await supabase
                    .from('candidates')
                    .select('id, class_id')
                    .eq('email', email.toLowerCase())
                    .maybeSingle();
                identity = cand;
            }

            // 3. Check for ACTIVE candidate exams
            const { data: activeConfigs } = await supabase
                .from('exam_configs')
                .select('id, subject_id, visible_at')
                .eq('question_type', 'candidate')
                .eq('is_active', true)
                .eq('session_id', curSession)
                .eq('term_id', curTerm);

            if (activeConfigs && activeConfigs.length > 0) {
                // Check if already taken (Step 3 & 11)
                const { data: results } = await supabase
                    .from('exam_results')
                    .select('exam_id, subject_id')
                    .eq('student_id', identity?.id || data.user.id)
                    .eq('session_id', curSession)
                    .eq('term_id', curTerm)
                    .eq('question_type', 'candidate');

                const takenExamIds = new Set(results?.map(r => r.exam_id) || []);
                const takenSubjects = new Set(results?.map(r => r.subject_id) || []);

                const availableExams = activeConfigs.filter(c => {
                    const notTaken = !takenExamIds.has(c.id) && !takenSubjects.has(c.subject_id);
                    const isTimeReady = !c.visible_at || new Date(c.visible_at) <= new Date();
                    return notTaken && isTimeReady;
                });

                if (availableExams.length > 0) {
                    navigate('/portal/candidate/active-exam');
                    return;
                } else if (activeConfigs.length > 0) {
                    // Redirect to Submitted Screen if they have completed (Step 11)
                    navigate('/portal/candidate/submitted', { replace: true });
                    return;
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
                    src={dbLogo || logoFallback}
                    onError={(e) => { e.target.src = logoFallback; }}
                    alt="Logo"
                    className="portal-logo-img"
                />
                <h1 className="portal-school-name">Fad Mastro Academy</h1>
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

