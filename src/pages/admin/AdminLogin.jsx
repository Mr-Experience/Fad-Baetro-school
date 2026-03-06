import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();

    const navigateTo = '/portal/admin';

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

                    if (!profileError && profile && (profile.role === 'admin' || profile.role === 'super_admin')) {
                        if (isChecking) {
                            const from = location.state?.from?.pathname || location.state?.from || navigateTo;
                            const search = location.state?.from?.search || '';
                            navigate(from + search, { replace: true });
                        }
                        return; // Don't set checkingSession to false, let the redirect happen
                    } else if (profile && profile.role !== 'admin' && profile.role !== 'super_admin') {
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

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                if (authError.message === 'Failed to fetch') {
                    throw new Error('Connection error. Please check your internet.');
                }
                throw authError;
            }

            if (data.user) {
                // Ensure the "Logging in..." label is seen briefly for stability
                setLoginStatus('verifying');

                // Fetch profile to verify role
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
                    await supabase.auth.signOut();
                    throw new Error('Unauthorized: Admin access required.');
                }

                // Brief pause so the user actually sees "Verifying role..."
                await new Promise(resolve => setTimeout(resolve, 600));

                // Final transition to intended page or dashboard
                setShowOverlay(true);
                const from = location.state?.from?.pathname || location.state?.from || navigateTo;
                const search = location.state?.from?.search || '';

                setTimeout(() => {
                    navigate(from + search, { replace: true });
                }, 800);
            }
        } catch (err) {
            console.error("Login process error:", err);
            setError(err.message);
            setLoading(false);
            setLoginStatus('');
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


