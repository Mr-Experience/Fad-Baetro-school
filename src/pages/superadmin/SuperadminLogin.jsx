import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../student/NoExamSchedule.css'; // Reusing header styles
import './SuperadminLogin.css';
import logo from '../../assets/logo.jpg';
import { supabase } from '../../supabaseClient';

const SuperadminLogin = () => {
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
            navigate('/portal/superadmin/config');
        }
    };

    return (
        <div className="sal-container">
            {/* Simple Header */}
            <header className="portal-header-bar sal-header">
                <div className="sal-header-left">
                    <img src={logo} alt="Logo" className="portal-logo-img" />
                    <h1 className="portal-school-name">Fad Mastro Academy</h1>
                </div>
            </header>

            {/* Main Login Card */}
            <main className="sal-main">
                <div className="sal-card">
                    <h2 className="sal-title">Login to staff portal</h2>

                    {error && <div style={{ color: 'red', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

                    <form className="sal-form" onSubmit={handleLogin}>
                        <div className="sal-form-group">
                            <label className="sal-label">Email*</label>
                            <input
                                type="email"
                                className="sal-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="sal-form-group">
                            <label className="sal-label">Password*</label>
                            <input
                                type="password"
                                className="sal-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="sal-reset-row">
                            <a href="#reset" className="sal-reset-link">Reset Password</a>
                        </div>

                        <button type="submit" className="sal-login-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login to portal'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default SuperadminLogin;
