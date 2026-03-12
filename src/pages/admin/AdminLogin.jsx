import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import '../auth/PortalLogin.css';
import { supabase } from '../../supabaseClient';
import logoFallback from '../../assets/logo.jpg';
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

    // Check for existing session on load
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // If already logged in as admin, redirect to dashboard
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (profile && (profile.role === 'admin' || profile.role === 'super_admin')) {
                    navigate(navigateTo, { replace: true });
                    return;
                }
            }
            setCheckingSession(false);
        };
        checkSession();
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
                let { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .maybeSingle();

                // 2b. Auto-heal the admin profile if it got dropped during SQL migration
                if (!profile) {
                    const authRole = data.user.user_metadata?.role;
                    const email = data.user.email?.toLowerCase() || '';

                    // Logic to identify an admin: metadata check or email keyword
                    if (authRole === 'admin' || email.includes('admin')) {
                        const { error: insertError } = await supabase.from('profiles').insert({
                            id: data.user.id,
                            email: email,
                            full_name: data.user.user_metadata?.full_name || 'Administrator',
                            role: 'admin'
                        });

                        if (!insertError) {
                            profile = { role: 'admin' };
                        }
                    }
                }

                if (!profile) {
                    await supabase.auth.signOut();
                    throw new Error('Unauthorized: No admin profile found. Contact Super Admin.');
                }

                if (profile.role === 'super_admin' || profile.role === 'super-admin') {
                    await supabase.auth.signOut();
                    throw new Error('Super Admins must log in through the Super Admin portal (/portal/superadmin).');
                } else if (profile.role !== 'admin') {
                    await supabase.auth.signOut();
                    throw new Error('Unauthorized: Admin access required.');
                }

                // Final transition to intended page or dashboard
                setShowOverlay(true);
                localStorage.setItem('admin_session_start', new Date().toISOString());
                const from = location.state?.from?.pathname || location.state?.from || navigateTo;
                const search = location.state?.from?.search || '';

                navigate(from + search, { replace: true });
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
                    <img
                        src={logoFallback}
                        alt="Logo"
                        className="portal-logo-img"
                    />
                    <h1 className="portal-school-name">Fad Maestro Academy</h1>
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

                            <div className="form-group" style={{ marginBottom: '8px' }}>
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
                                <Link to="/portal/admin/forgot-password" className="forgot-password-link">Forgotten password</Link>
                            </div>

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


