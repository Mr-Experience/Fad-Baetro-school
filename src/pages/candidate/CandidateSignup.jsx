import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import logoFallback from '../../assets/logo.jpg';
import './CandidateSignup.css';

const CandidateSignup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [classes, setClasses] = useState([]);
    const [success, setSuccess] = useState(false);
    const [dbLogo, setDbLogo] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('system_settings').select('school_logo_url').eq('id', 1).maybeSingle();
            if (data?.school_logo_url) setDbLogo(data.school_logo_url);
        };
        fetchSettings();
    }, []);

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        class_id: '',
        password: '',
        confirm_password: ''
    });

    useEffect(() => {
        const fetchClasses = async () => {
            const { data } = await supabase.from('classes').select('*').order('class_name');
            if (data) setClasses(data);
        };
        fetchClasses();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const generateEmail = (name) => {
        if (!name) return '';
        const sanitized = name.toLowerCase().trim().replace(/\s+/g, '.');
        return `${sanitized}@candidate.com`;
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const generatedEmail = generateEmail(formData.full_name);

        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            // 1. Auth SignUp
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: generatedEmail,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.full_name,
                        role: 'candidate'
                    }
                }
            });

            if (authError) throw authError;
            const newUserId = authData.user?.id;

            if (!newUserId) throw new Error("Could not create account");

            // 2. Create Profile
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: newUserId,
                full_name: formData.full_name,
                email: generatedEmail,
                role: 'candidate'
            });

            if (profileError) throw profileError;

            // 3. Create Candidate Record
            const { error: candidateError } = await supabase.from('candidates').insert({
                id: newUserId,
                full_name: formData.full_name,
                email: generatedEmail,
                phone_number: formData.phone_number,
                class_id: formData.class_id,
                status: 'pending'
            });

            if (candidateError) throw candidateError;

            setSuccess(true);
        } catch (err) {
            console.error("Signup error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="cs-container">
                <div className="cs-card success-card">
                    <div className="cs-success-icon">✓</div>
                    <h2 style={{ color: 'var(--primary-800)', marginBottom: '15px' }}>Admission Account Created!</h2>
                    <p style={{ color: 'var(--gray-600)' }}>Your unique admission login email is:</p>
                    <div style={{
                        background: 'var(--primary-50)',
                        padding: '20px',
                        borderRadius: '15px',
                        fontSize: '20px',
                        fontWeight: '800',
                        color: 'var(--primary-700)',
                        margin: '20px 0',
                        border: '1.5px dashed var(--primary-200)'
                    }}>
                        {generateEmail(formData.full_name)}
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--gray-500)', maxWidth: '400px', margin: '0 auto 30px' }}>
                        Please use this email and your password to login to the portal.
                        <strong> Note:</strong> You will not receive any external email notification.
                    </p>
                    <button className="cs-btn-primary" onClick={() => navigate('/portal/candidate')}>Proceed to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="cs-container">
            <div className="cs-header-bar">
                <img
                    src={dbLogo || logoFallback}
                    onError={(e) => { e.target.src = logoFallback; }}
                    alt="Logo"
                    className="cs-logo"
                />
                <h1 className="cs-school-name">Fad Maestro Academy</h1>
            </div>

            <div className="cs-card">
                <h2 className="cs-title">Candidate Admission Portal</h2>
                <p className="cs-subtitle">Start your application by creating an identity</p>

                {error && <div className="cs-error">{error}</div>}

                <form onSubmit={handleSignup} className="cs-form">
                    <div className="cs-form-group">
                        <label>Full Name*</label>
                        <input
                            type="text"
                            name="full_name"
                            required
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="e.g. John Doe"
                        />
                    </div>

                    <div className="cs-form-group">
                        <label>Your Admission Login Email (Automated)</label>
                        <div style={{ padding: '12px', background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: '10px', color: '#64748B', fontSize: '14px' }}>
                            {formData.full_name ? generateEmail(formData.full_name) : 'fullname@candidate.com'}
                        </div>
                    </div>

                    <div className="cs-form-row">
                        <div className="cs-form-group">
                            <label>Phone Number (Guardian/Parent)</label>
                            <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="080..." />
                        </div>
                        <div className="cs-form-group">
                            <label>Applying for Class*</label>
                            <select name="class_id" required value={formData.class_id} onChange={handleChange}>
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="cs-form-row">
                        <div className="cs-form-group">
                            <label>Choose Password*</label>
                            <input type="password" name="password" required value={formData.password} onChange={handleChange} />
                        </div>
                        <div className="cs-form-group">
                            <label>Confirm Password*</label>
                            <input type="password" name="confirm_password" required value={formData.confirm_password} onChange={handleChange} />
                        </div>
                    </div>

                    <button type="submit" className="cs-btn-submit" disabled={loading}>
                        {loading ? 'Generating Account...' : 'Create Admission Account'}
                    </button>

                    <p className="cs-footer-text">
                        Already have an application? <Link to="/portal/candidate">Login here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default CandidateSignup;
