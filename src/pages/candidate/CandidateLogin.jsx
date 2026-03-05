import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../auth/PortalLogin.css';
import './CandidateLogin.css';
import logo from '../../assets/logo.jpg';
import { supabase } from '../../supabaseClient';

const CandidateLogin = () => {
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
            // Check if ANY candidate exam is currently ACTIVE
            const { data: activeExams } = await supabase
                .from('exam_configs')
                .select('id')
                .eq('question_type', 'candidate')
                .eq('is_active', true)
                .limit(1);

            if (activeExams && activeExams.length > 0) {
                navigate('/portal/candidate/active-exam');
            } else {
                navigate('/portal/candidate/no-exam');
            }
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
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CandidateLogin;

