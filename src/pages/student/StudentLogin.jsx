import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../auth/PortalLogin.css';
import logo from '../../assets/logo.jpg';
import { supabase } from '../../supabaseClient';

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
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('class_id')
                .eq('email', email.toLowerCase())
                .maybeSingle();

            if (!student) {
                // If they are NOT a student, kick them out immediately
                await supabase.auth.signOut();
                setError('Unauthorized: This portal is for students only.');
                setLoading(false);
                return;
            }

            if (student.class_id) {
                // 2. Check if ANY exam is currently ACTIVE for this class
                const { data: activeExams } = await supabase
                    .from('student_active_exams')
                    .select('*')
                    .eq('class_id', student.class_id)
                    .limit(1);

                if (activeExams && activeExams.length > 0) {
                    navigate('/portal/student/active-exam');
                    return;
                }
            }

            // Default to no-exam if nothing is active
            navigate('/portal/student/no-exam');
        }
    };

    return (
        <div className="portal-login-container">
            <header className="portal-header-bar">
                <img src={logo} alt="Logo" className="portal-logo-img" />
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

                        <a href="#reset" className="forgot-password-link">Reset Password</a>

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
