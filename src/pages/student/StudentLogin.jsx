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
            // 1. Verify existence in students table (STRICT ROLE CHECK)
            const { data: student } = await supabase
                .from('students')
                .select('id, class_id')
                .eq('email', email.toLowerCase())
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
                // 3. DETERMINE ACTIVE EXAM (Step 2)
                const { data: activeConfigs } = await supabase
                    .from('exam_configs')
                    .select('id, subject_id, question_type, visible_at')
                    .eq('class_id', student.class_id)
                    .eq('session_id', activeSession)
                    .eq('term_id', activeTerm)
                    .eq('is_active', true);

                if (activeConfigs && activeConfigs.length > 0) {
                    // 4. CHECK IF STUDENT ALREADY TOOK EXAM (Step 3 & 11)
                    const { data: results } = await supabase
                        .from('exam_results')
                        .select('exam_id, subject_id, question_type')
                        .eq('student_id', student.id)
                        .eq('session_id', activeSession)
                        .eq('term_id', activeTerm);

                    const takenExamIds = new Set(results?.map(r => r.exam_id) || []);
                    const takenKeys = new Set(results?.map(r => `${r.subject_id}_${r.question_type}`) || []);

                    const availableExams = activeConfigs.filter(c => {
                        const notTaken = !takenExamIds.has(c.id) && !takenKeys.has(`${c.subject_id}_${c.question_type}`);
                        const isTimeReady = !c.visible_at || new Date(c.visible_at) <= new Date();
                        return notTaken && isTimeReady;
                    });

                    if (availableExams.length > 0) {
                        navigate('/portal/student/active-exam');
                        return;
                    } else if (activeConfigs.length > 0) {
                        // If all active exams for this class are taken, REDIRECT TO SUBMITTED SCREEN (Step 11)
                        navigate('/portal/student/submitted', { replace: true });
                        return;
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
                <img src={dbLogo || logoFallback} alt="Logo" className="portal-logo-img" />
                <h1 className="portal-school-name">Fad Mastro Academy</h1>
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
