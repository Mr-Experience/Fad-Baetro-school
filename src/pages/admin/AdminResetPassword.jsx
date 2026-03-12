import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../auth/PortalLogin.css';
import { supabase } from '../../supabaseClient';
import logoFallback from '../../assets/logo.jpg';
import LoadingOverlay from '../../components/LoadingOverlay';

const AdminResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState(''); // '', 'loading', 'success'
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Check if we have a session (Supabase handles this automatically via the link)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("Your reset session has expired or is invalid. Please request a new link.");
            }
        };
        checkSession();
    }, []);

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError('');
        
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setStatus('loading');

        try {
            // 1. FINAL SECURITY CHECK: Ensure the user being reset is actually an admin
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No active session found.");

            const { data: profile, error: profileErr } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            if (profileErr) throw profileErr;
            if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
                throw new Error("Unauthorized: Password reset is restricted to administrator accounts only.");
            }

            // 2. Perform the update
            const { error: resetError } = await supabase.auth.updateUser({
                password: password
            });

            if (resetError) throw resetError;
            
            // 3. GLOBAL LOGOUT: Logout from all devices
            await supabase.auth.signOut({ scope: 'global' });
            
            setStatus('success');
            // Wait 3 seconds and redirect to login
            setTimeout(() => {
                navigate('/portal/admin/login');
            }, 3000);
        } catch (err) {
            console.error("Reset error:", err);
            setError(err.message);
            setStatus('');
        }
    };

    return (
        <>
            <LoadingOverlay isVisible={status === 'loading'} />
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
                    <div className="login-card" style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        padding: '32px',
                        width: '100%',
                        maxWidth: '400px'
                    }}>
                        <h2 className="login-title" style={{ fontSize: '24px', textAlign: 'center', marginBottom: '16px' }}>Set new password</h2>
                        
                        <p style={{ 
                            textAlign: 'center', 
                            fontSize: '14px', 
                            color: '#6B7280', 
                            marginBottom: '24px',
                            lineHeight: '1.6'
                        }}>
                            {status === 'success' 
                                ? "Your password has been reset successfully! Redirecting you to login..."
                                : "Please enter and confirm your new administrator password below."}
                        </p>

                        <div className="login-alert-container" style={{ width: '100%' }}>
                            {error && <div className="login-error-msg">{error}</div>}
                            {status === 'success' && (
                                <div className="login-error-msg" style={{ background: '#ECFDF5', color: '#059669', borderColor: '#D1FAE5', width: '100%' }}>
                                    Password updated!
                                </div>
                            )}
                        </div>

                        {status !== 'success' && (
                            <form className="login-form" onSubmit={handlePasswordReset} autoComplete="off" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div className="form-group" style={{ textAlign: 'center', width: '100%', marginBottom: '20px' }}>
                                    <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>New Password*</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="form-input"
                                        placeholder="••••••••"
                                        required
                                        style={{ textAlign: 'center', width: '100%' }}
                                    />
                                </div>

                                <div className="form-group" style={{ textAlign: 'center', width: '100%', marginBottom: '20px' }}>
                                    <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Confirm New Password*</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="form-input"
                                        placeholder="••••••••"
                                        required
                                        style={{ textAlign: 'center', width: '100%' }}
                                    />
                                </div>

                                <button type="submit" className="login-btn" style={{ width: '100%', height: '44px' }}>
                                    Reset Password
                                </button>
                            </form>
                        )}

                        <div style={{ textAlign: 'center', marginTop: '24px' }}>
                            <Link to="/portal/admin/login" className="forgot-password-link" style={{ fontSize: '14px', fontWeight: '600' }}>
                                Back to login
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default AdminResetPassword;
