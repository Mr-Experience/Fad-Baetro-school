import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient, supabase } from '../../supabaseClient';
import { UserPlus, ArrowLeft, ShieldCheck } from 'lucide-react';
import './SchoolConfig.css'; // Reusing some base styles

const RegisterAdmin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('admin');
    const [loading, setLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const tempSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                { 
                    auth: { 
                        persistSession: false, 
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    } 
                }
            );

            const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName, role: role } }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 1. Instantly trigger Success UI and Navigation
                setLoading(false);
                setRedirecting(true);
                setSuccess(`Successfully registered ${fullName}!`);
                
                // 2. Immediate Navigation (Instant feel)
                navigate('/portal/superadmin/config', { replace: true });

                // 3. Background Sync (Fire and forget, doesn't block UI navigation)
                supabase
                    .from('profiles')
                    .upsert({
                        id: authData.user.id,
                        email: email.trim().toLowerCase(),
                        full_name: fullName.trim(),
                        role: role.trim().toLowerCase()
                    })
                    .then(({ error: profileError }) => {
                        if (profileError && profileError.code !== '42501') {
                            console.error("Background profile sync warning:", profileError);
                        }
                    });
            }
        } catch (err) {
            console.error("Full Registration error:", err);
            setError(err.message || "Failed to register administrator.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sc-container">
            <header className="sc-header">
                <div className="sc-header-left" onClick={() => navigate('/portal/superadmin/config')} style={{ cursor: 'pointer' }}>
                    <ArrowLeft size={20} />
                    <span className="sc-brand-name">Back to Config</span>
                </div>
            </header>

            <main className="sc-main" style={{ padding: '24px 16px' }}>
                <div className="sc-card" style={{ maxWidth: '440px', padding: '24px 32px' }}>
                    <div className="sc-icon-circle" style={{ background: '#FFF0F6', width: '56px', height: '56px', marginBottom: '16px' }}>
                        <ShieldCheck size={28} color="#9D245A" />
                    </div>

                    <h2 className="sc-title" style={{ fontSize: '20px', marginBottom: '8px' }}>Register Administrator</h2>
                    <p className="sc-subtitle" style={{ marginBottom: '20px' }}>Create a new administrative account for the school portal.</p>

                    {error && <div className="sc-alert sc-alert-error" style={{ marginBottom: '12px' }}>{error}</div>}
                    {success && (
                        <div className="sc-alert" style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #D1FAE5', marginBottom: '12px' }}>
                            {success}
                        </div>
                    )}

                    <form className="sc-form" onSubmit={handleRegister} style={{ gap: '10px' }}>
                        <div className="sc-form-group" style={{ textAlign: 'left', width: '100%', marginBottom: '10px' }}>
                            <label className="sc-label" style={{ fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '4px', display: 'block' }}>Full Name*</label>
                            <input
                                type="text"
                                className="sc-select"
                                style={{ padding: '0 16px', appearance: 'auto', height: '40px' }}
                                placeholder="Enter full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="sc-form-group" style={{ textAlign: 'left', width: '100%', marginBottom: '10px' }}>
                            <label className="sc-label" style={{ fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '4px', display: 'block' }}>Email Address*</label>
                            <input
                                type="email"
                                className="sc-select"
                                style={{ padding: '0 16px', appearance: 'auto', height: '40px' }}
                                placeholder="admin@fadmaestro.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="sc-form-group" style={{ textAlign: 'left', width: '100%', marginBottom: '10px' }}>
                            <label className="sc-label" style={{ fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '4px', display: 'block' }}>Password*</label>
                            <input
                                type="password"
                                className="sc-select"
                                style={{ padding: '0 16px', appearance: 'auto', height: '40px' }}
                                placeholder="Min 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="sc-form-group" style={{ textAlign: 'left', width: '100%', marginBottom: '16px' }}>
                            <label className="sc-label" style={{ fontSize: '13px', fontWeight: '600', color: '#4B5563', marginBottom: '4px', display: 'block' }}>Administrative Role*</label>
                            <div className="sc-select-wrap">
                                <select 
                                    className="sc-select" 
                                    value={role} 
                                    onChange={(e) => setRole(e.target.value)}
                                    style={{ height: '40px' }}
                                >
                                    <option value="admin">Admin (Standard)</option>
                                    <option value="super_admin">Super Admin (Full Access)</option>
                                </select>
                                <div className="sc-select-arrow">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="sc-save-btn" 
                            disabled={loading || redirecting}
                            style={{ 
                                height: '44px',
                                backgroundColor: redirecting ? '#059669' : '#9D245A' 
                            }}
                        >
                            {loading ? 'Processing...' : redirecting ? 'Success! Redirecting...' : 'Register Account'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default RegisterAdmin;
