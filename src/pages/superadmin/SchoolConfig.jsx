import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, X, LogOut } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import '../student/NoExamSchedule.css';
import './SchoolConfig.css';
import logoFallback from '../../assets/logo.jpg';
import LoadingOverlay from '../../components/LoadingOverlay';

const SchoolConfig = () => {
    const navigate = useNavigate();
    const [currentSession, setCurrentSession] = useState('');
    const [currentTerm, setCurrentTerm] = useState('');

    const [activeSession, setActiveSession] = useState('');
    const [activeTerm, setActiveTerm] = useState('');

    const [profile, setProfile] = useState(() => {
        const cached = sessionStorage.getItem('fad_superadmin_profile');
        return cached ? JSON.parse(cached) : null;
    });
    const [loading, setLoading] = useState(!profile);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [error, setError] = useState('');
    const [showAdminList, setShowAdminList] = useState(false);
    const [admins, setAdmins] = useState([]);
    const [fetchingAdmins, setFetchingAdmins] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                
                if (!session) {
                    if (isMounted) setLoading(false);
                    return;
                }

                // Fetch everything in parallel with a safety timeout
                const [profileRes, settingsRes] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
                    supabase.from('system_settings').select('*').eq('id', 1).maybeSingle()
                ]);

                if (!isMounted) return;

                if (profileRes.data) {
                    setProfile(profileRes.data);
                    sessionStorage.setItem('fad_superadmin_profile', JSON.stringify(profileRes.data));
                }

                if (settingsRes.data) {
                    const s = settingsRes.data;
                    setCurrentSession(s.current_session || '2024/2025');
                    setCurrentTerm(s.current_term || 'First Term');
                    setActiveSession(s.current_session || '2024/2025');
                    setActiveTerm(s.current_term || 'First Term');
                    sessionStorage.setItem('fad_system_settings', JSON.stringify(s));
                } else {
                    // Try fallback to cache for settings too
                    const cachedSettings = sessionStorage.getItem('fad_system_settings');
                    if (cachedSettings) {
                        const s = JSON.parse(cachedSettings);
                        setCurrentSession(s.current_session);
                        setCurrentTerm(s.current_term);
                        setActiveSession(s.current_session);
                        setActiveTerm(s.current_term);
                    }
                }

                // Finish loading even if partial data missing
                setLoading(false);
                
                // 1. Initial Fetch (Prefetch - Silent to avoid flicker)
                fetchAdmins(true);

                // 2. Realtime Subscription for instant sync
                const crossSessionSync = supabase
                    .channel('admin-list-sync')
                    .on('postgres_changes', { 
                        event: '*', 
                        schema: 'public', 
                        table: 'profiles',
                        filter: 'role=eq.admin' // Strictly track only 'admin' role changes
                    }, () => {
                        fetchAdmins(true); // Silent refresh on background changes
                    })
                    .subscribe();

                return () => {
                    supabase.removeChannel(crossSessionSync);
                };
            } catch (err) {
                console.error("Superadmin Init Error:", err);
                if (isMounted) {
                    setError("Failed to initialize session. Please try refreshing.");
                    setLoading(false);
                }
            }
        };

        init();
        return () => { isMounted = false; };
    }, [navigate]);

    const fetchAdmins = async (silent = false) => {
        if (!silent) setFetchingAdmins(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('id, full_name, email, role, avatar_url')
                .eq('role', 'admin') // Strictly filter profiles table for 'admin' role
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setAdmins(data || []);
        } catch (err) {
            console.error('Error fetching admins:', err);
            if (!silent) setError('Failed to load administrators');
        } finally {
            if (!silent) setFetchingAdmins(false);
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

        const previousAdmins = [...admins];
        try {
            // Optimistic Update: Remove from UI immediately
            setAdmins(prev => prev.filter(a => a.id !== adminId));
            setToast(`Deleting ${adminName}...`);

            const { error: deleteError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', adminId);

            if (deleteError) {
                // Rollback if delete fails
                setAdmins(previousAdmins);
                throw deleteError;
            }

            setToast(`Deleted ${adminName} successfully`);
            setTimeout(() => setToast(''), 2500);
        } catch (err) {
            console.error('Error deleting admin:', err);
            setError(err.message || 'Failed to delete admin');
            setAdmins(previousAdmins); // Ensure rollback on any catch
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setToast('');
        setError('');
        
        const sessionCopy = currentSession;
        const termCopy = currentTerm;

        try {
            const { error: saveError } = await supabase
                .from('system_settings')
                .upsert({
                    id: 1,
                    current_session: sessionCopy,
                    current_term: termCopy,
                    updated_at: new Date().toISOString()
                });

            if (saveError) throw saveError;

            // Update active state immediately for UI consistency
            setActiveSession(sessionCopy);
            setActiveTerm(termCopy);
            
            setToast('Settings saved successfully!');
            setTimeout(() => setToast(''), 2000);
        } catch (err) {
            console.error("Save Error:", err);
            setError(err.message || 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            setLoading(true);
            await supabase.auth.signOut();
            window.location.href = '/portal/superadmin';
        } catch (err) {
            navigate('/portal/superadmin');
        }
    };

    const handleOpenAdminList = () => {
        setShowAdminList(true);
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
            {saving && <LoadingOverlay isVisible={true} />}

            {/* Floating toast */}
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
                        <span className="sc-badge-text">
                            {activeSession ? `Current Session: ${activeSession} ${activeTerm}` : 'Loading Session...'}
                        </span>
                    </div>
                    
                    <div className="ad-user-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '12px' }}>
                        <span className="sc-user-name" style={{ marginRight: 0 }}>{profile?.full_name || '...'}</span>
                    </div>

                    <div className="sc-avatar">
                        <img
                            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Super Admin')}&background=D1D5DB&color=333`}
                            alt="Avatar"
                        />
                    </div>
                    <button className="sc-logout-icon-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <div className="sc-action-bar">
                <button className="sc-register-btn" onClick={() => navigate('/portal/superadmin/users')}>
                    <UserPlus size={18} />
                    Manage User
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
                            {fetchingAdmins && admins.length === 0 ? (
                                <div className="sc-modal-empty">Loading administrators...</div>
                            ) : admins.length === 0 ? (
                                <div className="sc-modal-empty">No administrators found.</div>
                            ) : (
                                <div className="sc-admin-table">
                                    <div className="sc-table-header">
                                        <span>Full Name</span>
                                        <span>Email Address</span>
                                        <span>User Role</span>
                                        <span style={{ textAlign: 'right' }}>Action</span>
                                    </div>
                                    <div className="sc-table-body">
                                        {admins.map(admin => (
                                            <div key={admin.id} className="sc-admin-row">
                                                <div className="sc-admin-cell name">
                                                    <div className="sc-admin-avatar-small">
                                                        {admin.full_name.charAt(0)}
                                                    </div>
                                                    <span>{admin.full_name}</span>
                                                </div>
                                                <div className="sc-admin-cell email">
                                                    {admin.email}
                                                </div>
                                                <div className="sc-admin-cell role" style={{ display: 'flex' }}>
                                                    <span className="ad-role-badge" data-role={admin.role} style={{ margin: 0, fontSize: '9px' }}>
                                                        {admin.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </span>
                                                </div>
                                                <div className="sc-admin-cell action">
                                                    <button 
                                                        className="sc-delete-icon-btn"
                                                        onClick={() => handleDeleteAdmin(admin.id, admin.full_name)}
                                                        title="Delete Admin"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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

                    {loading ? (
                        <div style={{ padding: '40px 0', textAlign: 'center' }}>
                            <div className="sc-spinner"></div>
                            <p style={{ marginTop: '12px', color: '#6B7280', fontSize: '14px' }}>Fetching configuration...</p>
                        </div>
                    ) : (
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
                    )}
                </div>
            </main>
        </div>
    );
};

export default SchoolConfig;
