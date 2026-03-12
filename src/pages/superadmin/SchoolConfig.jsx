import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Settings, Trash2, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import '../student/NoExamSchedule.css';
import './SchoolConfig.css';
import logoFallback from '../../assets/logo.jpg';
import LoadingOverlay from '../../components/LoadingOverlay';

const SchoolConfig = () => {
    const navigate = useNavigate();
    const [currentSession, setCurrentSession] = useState('2025/2026');
    const [currentTerm, setCurrentTerm] = useState('First Term');

    const [activeSession, setActiveSession] = useState('2025/2026');
    const [activeTerm, setActiveTerm] = useState('First Term');

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [error, setError] = useState('');
    const [showAdminList, setShowAdminList] = useState(false);
    const [admins, setAdmins] = useState([]);
    const [fetchingAdmins, setFetchingAdmins] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            // Only show initial loader if we have absolutely nothing
            if (!profile) setLoading(true);
            
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
        // If we already have some data, fetch the rest silently in the background
        if (!activeSession) setLoading(true);
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

    const handleForceLogout = async () => {
        if (!window.confirm("CRITICAL ACTION: This will log out EVERY administrator currently logged into the portal. They will need to log in again. Continue?")) {
            return;
        }

        setSaving(true);
        try {
            const { error: resetError } = await supabase
                .from('system_settings')
                .update({ 
                    admin_reset_signal: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1);

            if (resetError) throw resetError;

            setToast('Global logout signal sent successfully!');
            setTimeout(() => setToast(''), 3000);
        } catch (err) {
            console.error('Error sending reset signal:', err);
            setError('Failed to send logout signal. If this persists, the database column might be missing.');
        } finally {
            setSaving(false);
        }
    };

    const fetchAdmins = async () => {
        setFetchingAdmins(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'admin')
                .order('full_name');

            if (fetchError) throw fetchError;
            setAdmins(data || []);
        } catch (err) {
            console.error('Error fetching admins:', err);
            setError('Failed to load administrators');
        } finally {
            setFetchingAdmins(false);
        }
    };

    const handleDeleteAdmin = async (adminId, adminName) => {
        if (adminId === profile?.id) {
            alert("You cannot delete your own account.");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${adminName}'s account? This will remove their administrative access.`)) {
            return;
        }

        setSaving(true);
        try {
            const { error: deleteError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', adminId);

            if (deleteError) throw deleteError;

            setAdmins(prev => prev.filter(a => a.id !== adminId));
            setToast(`Deleted ${adminName} successfully`);
            setTimeout(() => setToast(''), 3000);
        } catch (err) {
            console.error('Error deleting admin:', err);
            setError(err.message || 'Failed to delete admin');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenAdminList = () => {
        setShowAdminList(true);
        fetchAdmins();
    };

    // Generate session options dynamically to ensure they never "end"
    const sessionOptions = React.useMemo(() => {
        const startYear = 2024;
        const currentYear = new Date().getFullYear();
        // Ensure selected year is parsed correctly
        const selectedStartYear = parseInt(currentSession?.split('/')[0]) || currentYear;
        
        // Show at least 10 years into the future, or 2 years beyond selected session 
        // if we're in the Third Term to allow for the next academic year.
        const maxYear = Math.max(currentYear + 10, selectedStartYear + (currentTerm === 'Third Term' ? 2 : 1));
        
        const options = [];
        for (let y = startYear; y <= maxYear; y++) {
            options.push(`${y}/${y + 1}`);
        }
        return options;
    }, [currentSession, currentTerm]);

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

            <div className="sc-action-bar">
                <button 
                    className="sc-settings-btn" 
                    onClick={handleOpenAdminList}
                    title="Manage Administrators"
                >
                    <Settings size={20} />
                </button>
                <button className="sc-register-btn" onClick={() => navigate('/portal/superadmin/register')}>
                    <UserPlus size={18} />
                    Register New Admin
                </button>
            </div>

            {/* Admin List Modal */}
            {showAdminList && (
                <div className="sc-modal-overlay" onClick={() => setShowAdminList(false)}>
                    <div className="sc-modal" onClick={e => e.stopPropagation()}>
                        <div className="sc-modal-header">
                            <h3 className="sc-modal-title">Manage Administrators</h3>
                            <button className="sc-close-btn" onClick={() => setShowAdminList(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="sc-modal-body">
                            {fetchingAdmins ? (
                                <div className="sc-modal-empty">Loading administrators...</div>
                            ) : admins.length === 0 ? (
                                <div className="sc-modal-empty">No administrators found.</div>
                            ) : (
                                admins.map(admin => (
                                    <div key={admin.id} className="sc-admin-item">
                                        <span className="sc-admin-name">{admin.full_name}</span>
                                        {admin.id !== profile?.id && (
                                            <button 
                                                className="sc-delete-btn"
                                                onClick={() => handleDeleteAdmin(admin.id, admin.full_name)}
                                                title="Delete Admin"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main — vertically and horizontally centers the card */}
            <main className="sc-main">
                <div className="sc-card">
                    <div className="sc-icon-circle">
                        <div className="sc-info-icon">i</div>
                    </div>

                    <h2 className="sc-title">Set The Current Session (Latest)</h2>
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
                                {sessionOptions.map(session => (
                                    <option key={session} value={session}>Session {session}</option>
                                ))}
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

                    <div className="sc-danger-zone" style={{ marginTop: '32px', width: '100%', borderTop: '1px solid #fee2e2', paddingTop: '24px' }}>
                        <h3 style={{ fontSize: '14px', color: '#991B1B', marginBottom: '8px', fontWeight: '700' }}>Danger Zone</h3>
                        <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>Terminate all active administrator sessions immediately.</p>
                        <button
                            className="sc-reset-btn"
                            onClick={handleForceLogout}
                            disabled={loading || saving}
                            style={{ 
                                width: '100%', 
                                padding: '12px', 
                                backgroundColor: '#FEF2F2', 
                                border: '1.5px solid #FCA5A5', 
                                color: '#B91C1C', 
                                borderRadius: '10px', 
                                fontSize: '14px', 
                                fontWeight: '600', 
                                cursor: 'pointer' 
                            }}
                        >
                            {saving ? 'Processing...' : 'Force Global Admin Logout'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SchoolConfig;
