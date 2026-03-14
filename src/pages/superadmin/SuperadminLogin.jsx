import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../student/NoExamSchedule.css'; // Reusing header styles
import './SuperadminLogin.css';
import { supabase } from '../../supabaseClient';
import logoFallback from '../../assets/logo.jpg';
import LoadingOverlay from '../../components/LoadingOverlay';

const SuperadminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Instant Redirect: Check if already logged in before showing the form
    React.useEffect(() => {
        let isMounted = true;
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session && isMounted) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (profile && (profile.role === 'super_admin' || profile.role === 'super-admin')) {
                        // Instant jump to config
                        navigate('/portal/superadmin/config', { replace: true });
                        return;
                    }
                }
            } catch (err) {
                console.error("Session check error:", err);
            } finally {
                if (isMounted) setCheckingSession(false);
            }
        };
        checkSession();
        return () => { isMounted = false; };
    }, [navigate, location]);

    if (checkingSession) {
        // Show the loading overlay instantly instead of the login portal
        return <LoadingOverlay isVisible={true} />;
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Authenticate using Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (authError) {
                setPassword('');
                throw authError;
            }

            if (authData.user) {
                // Fetch profile to verify role
                let { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authData.user.id)
                    .maybeSingle();

                // 2b. Auto-heal Super Admin profile if missing
                if (!profile && !profileError) {
                    const email = authData.user.email?.toLowerCase() || '';
                    const metaRole = authData.user.user_metadata?.role;

                    // If email contains 'fad.com' or 'super' or meta says super, heal it
                    if (email.includes('fad.com') || email.includes('super') || metaRole?.includes('super')) {
                        const { error: insertError } = await supabase.from('profiles').insert({
                            id: authData.user.id,
                            email: email,
                            full_name: authData.user.user_metadata?.full_name || 'System Developer',
                            role: 'super_admin'
                        });
                        if (!insertError) profile = { role: 'super_admin' };
                    }
                }

                if (profileError) throw profileError;

                // 3. Strict Verification
                if (!profile) {
                    await supabase.auth.signOut();
                    throw new Error('Access denied. No super administrative profile found.');
                }

                // Verify specifically for super_admin variants
                const role = (profile.role || '').toLowerCase();
                if (role === 'super_admin' || role === 'super-admin') {
                    // Success -> Standardize landing on the Config portal as requested
                    navigate('/portal/superadmin/config', { replace: true });
                } else {
                    await supabase.auth.signOut();
                    throw new Error('Unauthorized. This portal is for Super Admins only.');
                }
            }
        } catch (err) {
            console.error("SuperAdmin Login Error:", err);
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sal-container">
            <header className="portal-header-bar sal-header">
                <div className="sal-header-left">
                    <img
                        src={logoFallback}
                        alt="Logo"
                        className="portal-logo-img"
                    />
                    <h1 className="portal-school-name">Fad Mastro Academy</h1>
                </div>
            </header>

            <main className="sal-main">
                <div className="sal-card">
                    <h2 className="sal-title">Login to Super Admin Portal</h2>
                    <p className="sal-subtitle-login">Secure access for master administrators.</p>

                    {error && <div className="sal-error-container">{error}</div>}

                    <form className="sal-form" onSubmit={handleLogin} autoComplete="off">
                        <div className="sal-form-group">
                            <label className="sal-label">Email*</label>
                            <input
                                type="email"
                                name="email"
                                className="sal-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="off"
                                required
                            />
                        </div>

                        <div className="sal-form-group">
                            <label className="sal-label">Password*</label>
                            <input
                                type="password"
                                name="password"
                                className="sal-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
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
