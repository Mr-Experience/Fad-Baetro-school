import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../auth/PortalLogin.css';
import { supabase } from '../../supabaseClient';
import logoFallback from '../../assets/logo.jpg';
import LoadingOverlay from '../../components/LoadingOverlay';

const AdminForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(''); // '', 'loading', 'success'
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleResetRequest = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('loading');

        try {
            // 1. STRICT ADMIN CHECK: Verify the email belongs to an admin/super_admin
            const { data: profile, error: profileErr } = await supabase
                .from('profiles')
                .select('role')
                .eq('email', email.toLowerCase().trim())
                .maybeSingle();

            if (profileErr) throw profileErr;

            if (!profile || profile.role !== 'admin') {
                // To prevent email enumeration, we could show a generic message, 
                // but since the user specifically asked "Only admin can reset", 
                // we'll show a clear unauthorized error.
                throw new Error("Unauthorized: Only standard admin accounts can reset passwords via this portal. Super Admins must use the Super Admin portal.");
            }

            // 2. Clear for reset
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/portal/admin/reset-password`,
            });

            if (resetError) throw resetError;
            
            setStatus('success');
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
                        <h2 className="login-title" style={{ fontSize: '24px', textAlign: 'center', marginBottom: '16px' }}>Reset your password</h2>
                        
                        <p style={{ 
                            textAlign: 'center', 
                            fontSize: '14px', 
                            color: '#6B7280', 
                            marginBottom: '24px',
                            lineHeight: '1.6'
                        }}>
                            {status === 'success' 
                                ? "If an account exists for this email, you will receive a password reset link shortly."
                                : "Enter your email address to receive a secure link to reset your admin password."}
                        </p>

                        <div className="login-alert-container" style={{ width: '100%' }}>
                            {error && <div className="login-error-msg">{error}</div>}
                            {status === 'success' && (
                                <div className="login-error-msg" style={{ background: '#ECFDF5', color: '#059669', borderColor: '#D1FAE5', width: '100%' }}>
                                    Reset link sent!
                                </div>
                            )}
                        </div>

                        {status !== 'success' && (
                            <form className="login-form" onSubmit={handleResetRequest} autoComplete="off" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div className="form-group" style={{ textAlign: 'center', width: '100%', marginBottom: '20px' }}>
                                    <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Email Address*</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="off"
                                        className="form-input"
                                        placeholder="admin@fadmaestro.com"
                                        required
                                        style={{ textAlign: 'center', width: '100%' }}
                                    />
                                </div>

                                <button type="submit" className="login-btn" style={{ width: '100%', height: '44px' }}>
                                    Send reset link
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

export default AdminForgotPassword;
