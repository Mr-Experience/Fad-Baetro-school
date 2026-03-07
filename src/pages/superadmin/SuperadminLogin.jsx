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
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authData.user.id)
                    .single();

                if (profileError || !profile) {
                    await supabase.auth.signOut();
                    setPassword('');
                    throw new Error('Access denied. No profile found.');
                }

                // 3. Verify specifically for super_admin
                if (profile.role === 'super_admin') {
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

                    <form className="sal-form" onSubmit={handleLogin}>
                        <div className="sal-form-group">
                            <label className="sal-label">Email*</label>
                            <input
                                type="email"
                                className="sal-input"
                                placeholder="Enter your email"
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
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
