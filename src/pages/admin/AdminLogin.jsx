import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../auth/PortalLogin.css';
import logo from '../../assets/logo.jpg';
import { supabase } from '../../supabaseClient';
import LoadingOverlay from '../../components/LoadingOverlay';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginStatus, setLoginStatus] = useState(''); // '', 'logging_in', 'verifying'
    const [showOverlay, setShowOverlay] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const navigate = useNavigate();

    // Check if already logged in
    useEffect(() => {
        let isChecking = true;
        const checkExistingSession = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                if (session) {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    if (!profileError && profile && profile.role === 'admin') {
                        if (isChecking) navigate('/portal/admin');
                        return; // Don't set checkingSession to false, let the redirect happen
                    } else if (profile && profile.role !== 'admin') {
                        // If they are logged in as a wrong role on the login page, log them out.
                        await supabase.auth.signOut();
                    }
                }
            } catch (err) {
                console.error("Error checking existing session:", err);
            }

            if (isChecking) {
                setCheckingSession(false);
            }
        };
        checkExistingSession();

        return () => {
            isChecking = false;
        };
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setLoginStatus('logging_in');

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            if (error.message === 'Failed to fetch') {
                setError('Connection error. Please check your internet.');
            } else {
                setError(error.message);
            }
            setLoading(false);
            setLoginStatus('');
            return;
        }

        if (data.user) {
            setLoginStatus('verifying');
            // Verify role before proceeding
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profileError || !profile || profile.role !== 'admin') {
                setError('Unauthorized: Admin access required.');
                await supabase.auth.signOut();
                setLoading(false);
                setLoginStatus('');
                return;
            }

            // Show the loading overlay
            setShowOverlay(true);

            // Wait a short moment for visual effect, then navigate
            setTimeout(() => {
                navigate('/portal/admin');
            }, 1000);
        }
    };

    if (checkingSession) {
        return <LoadingOverlay isVisible={true} />;
    }

    return (
        <>
            <LoadingOverlay isVisible={showOverlay} />
            <div className="portal-login-container">
                <header className="portal-header-bar">
                    <img src={logo} alt="Logo" className="portal-logo-img" />
                    <h1 className="portal-school-name">Fad Mastro Academy</h1>
                </header>

                <main className="portal-content">
                    <div className="login-card">
                        <h2 className="login-title">Login to admin portal</h2>

                        <div className="login-alert-container">
                            {error && <div className="login-error-msg">{error}</div>}
                        </div>

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
                                {loginStatus === 'logging_in' ? 'Logging in...' :
                                    loginStatus === 'verifying' ? 'Verifying role...' :
                                        'Login to portal'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </>
    );
};

export default AdminLogin;


