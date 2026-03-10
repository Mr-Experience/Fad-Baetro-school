import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../student/NoExamSchedule.css'; // Reusing header styles
import './SuperadminLogin.css';
import { supabase } from '../../supabaseClient';
import logoFallback from '../../assets/logo.jpg';

const SuperadminLogin = () => {
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
                // If a superadmin is already logged in, send them to config
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, role')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (profile && (profile.role === 'super_admin' || profile.role === 'super-admin')) {
                    navigate('/portal/superadmin/config', { replace: true });
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

        try {
            // 1. Sign in with password
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setPassword(''); // Reset password input on error
                throw authError;
            }

            if (authData.user) {
                // 2. Fetch user role from profiles table
                let { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authData.user.id)
                    .maybeSingle();

                // 2b. Auto-heal the super_admin profile if it got dropped during SQL migration
                if (!profile) {
                    // Check if they have super_admin in their auth metadata
                    const authRole = authData.user.user_metadata?.role;
                    if (authRole === 'super_admin' || authData.user.email?.toLowerCase().includes('super')) {
                        // Recreate the super_admin profile
                        const { error: insertError } = await supabase.from('profiles').insert({
                            id: authData.user.id,
                            email: authData.user.email,
                            full_name: authData.user.user_metadata?.full_name || 'Super Admin',
                            role: 'super_admin'
                        });

                        if (!insertError) {
                            profile = { role: 'super_admin' };
                        }
                    }
                }

                if (!profile) {
                    await supabase.auth.signOut();
                    setPassword('');
                    throw new Error('Access denied. No profile found in the database. Contact support.');
                }

                // 3. Verify specifically for super_admin or super-admin
                if (profile.role === 'super_admin' || profile.role === 'super-admin') {
                    navigate('/portal/superadmin/config');
                } else {
                    await supabase.auth.signOut();
                    setPassword('');
                    throw new Error('Unauthorized access. You are not a Super Admin.');
                }
            }
        } catch (err) {
            console.error("Login process error:", err);
            setError(err.message || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sal-container">
            {/* Simple Header */}
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

            {/* Main Login Card */}
            <main className="sal-main">
                <div className="sal-card">
                    <h2 className="sal-title">Login to Super Admin Portal</h2>

                    {error && <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px', textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca' }}>{error}</div>}

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
