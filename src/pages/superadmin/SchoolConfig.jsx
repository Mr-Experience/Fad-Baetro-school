import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../student/NoExamSchedule.css';
import './SchoolConfig.css';
import logoFallback from '../../assets/logo.jpg';
import LoadingOverlay from '../../components/LoadingOverlay';

const SchoolConfig = () => {
    const navigate = useNavigate();
    const [currentSession, setCurrentSession] = useState('2024/2025');
    const [currentTerm, setCurrentTerm] = useState('First Term');

    const [activeSession, setActiveSession] = useState('2024/2025');
    const [activeTerm, setActiveTerm] = useState('First Term');

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (profileData) setProfile(profileData);
            }
            await fetchSettings();
        };
        fetchUserData();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('system_settings')
                .select('*')
                .eq('id', 1)
                .single();
            if (data) {
                setCurrentSession(data.current_session);
                setCurrentTerm(data.current_term);
                setActiveSession(data.current_session);
                setActiveTerm(data.current_term);
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setToast('');
        setError('');
        try {
            const { error: saveError } = await supabase
                .from('system_settings')
                .upsert({
                    id: 1,
                    current_session: currentSession,
                    current_term: currentTerm,
                    updated_at: new Date().toISOString()
                });
            if (saveError) throw saveError;
            setActiveSession(currentSession);
            setActiveTerm(currentTerm);
            setToast('Settings updated successfully!');
            setTimeout(() => setToast(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="sc-container">
            <LoadingOverlay isVisible={loading || saving} />

            {/* Floating toast — rendered in fixed position so card layout never shifts */}
            {toast && (
                <div className="sc-toast">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {toast}
                </div>
            )}

            {/* Header */}
            <header className="sc-header">
                <div className="sc-header-left">
                    <img
                        src={logoFallback}
                        alt="Logo"
                        className="portal-logo-img"
                        style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                    />
                    <span className="sc-brand-name">Fad Mastro Academy</span>
                </div>

                <div className="sc-header-right">
                    <div className="sc-session-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9D245A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                        <span className="sc-badge-text">Current Session: {activeSession} {activeTerm}</span>
                    </div>
                    <span className="sc-user-name">{profile?.full_name || 'Super Admin'}</span>
                    <div className="sc-avatar">
                        <img
                            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Super Admin')}&background=D1D5DB&color=333`}
                            alt="Avatar"
                        />
                    </div>
                </div>
            </header>

            {/* Main — vertically and horizontally centers the card */}
            <main className="sc-main">
                <div className="sc-card">
                    <div className="sc-icon-circle">
                        <div className="sc-info-icon">i</div>
                    </div>

                    <h2 className="sc-title">Set The Current Session</h2>
                    <p className="sc-subtitle">
                        Set the current session and term details which will control the data content of the admin and student
                    </p>

                    {error && <div className="sc-alert sc-alert-error">{error}</div>}

                    <div className="sc-form">
                        <div className="sc-select-wrap">
                            <select
                                className="sc-select"
                                value={currentSession}
                                onChange={(e) => setCurrentSession(e.target.value)}
                                disabled={loading || saving}
                            >
                                <option value="2022/2023">Session 2022/2023</option>
                                <option value="2023/2024">Session 2023/2024</option>
                                <option value="2024/2025">Session 2024/2025</option>
                                <option value="2025/2026">Session 2025/2026</option>
                                <option value="2026/2027">Session 2026/2027</option>
                            </select>
                            <div className="sc-select-arrow">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div className="sc-select-wrap">
                            <select
                                className="sc-select"
                                value={currentTerm}
                                onChange={(e) => setCurrentTerm(e.target.value)}
                                disabled={loading || saving}
                            >
                                <option value="First Term">First Term</option>
                                <option value="Second Term">Second Term</option>
                                <option value="Third Term">Third Term</option>
                            </select>
                            <div className="sc-select-arrow">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        <button
                            className="sc-save-btn"
                            onClick={handleSave}
                            disabled={loading || saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SchoolConfig;
