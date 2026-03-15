import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { createClient, supabase } from '../../supabaseClient';
import './SuperAdminUsers.css'; 
import './SchoolConfig.css'; 

const SuperAdminUsers = () => {
    const navigate = useNavigate();
    const { profile } = useOutletContext();

    // User Profile state for display references
    const [activeSession, setActiveSession] = useState('');
    const [activeTerm, setActiveTerm] = useState('');

    // Page state
    const [selectedRole, setSelectedRole] = useState('student');
    const [allUsers, setAllUsers] = useState(() => {
        const cached = sessionStorage.getItem('fad_all_users_cache');
        return cached ? JSON.parse(cached) : {
            student: [],
            candidate: [],
            admin: [],
            super_admin: []
        };
    });
    const [loading, setLoading] = useState(!sessionStorage.getItem('fad_all_users_cache'));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [classes, setClasses] = useState([]);
    const [fetchError, setFetchError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        phone_number: '',
        class_id: ''
    });

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // 1. Fetch Settings
                const { data: settings } = await supabase.from('system_settings').select('current_session, current_term').eq('id', 1).maybeSingle();
                if (settings) {
                    setActiveSession(settings.current_session || '');
                    setActiveTerm(settings.current_term || '');
                }

                // 2. Fetch Classes
                const { data: classData } = await supabase.from('classes').select('*').order('class_name');
                if (classData) setClasses(classData);

                // 3. Omni-Fetch
                await fetchAllData();
            } catch (err) {
                console.error("Init Error:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [navigate]);

    const fetchAllData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        setFetchError(null);
        try {
            const roles = ['student', 'candidate', 'admin', 'super_admin'];
            const fetchPromises = roles.map(role => 
                supabase
                    .from('profiles')
                    .select('*, classes(class_name)')
                    .eq('role', role)
                    .order('created_at', { ascending: false })
            );

            const results = await Promise.all(fetchPromises);
            const newData = {};
            
            results.forEach((res, index) => {
                if (res.error) throw res.error;
                newData[roles[index]] = res.data || [];
            });

            setAllUsers(newData);
            sessionStorage.setItem('fad_all_users_cache', JSON.stringify(newData));
        } catch (err) {
            console.error("Omni-Fetch Error:", err);
            if (!isSilent) setFetchError(err.message || "Failed to load system data. Check connection.");
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const handleRoleChange = (e) => {
        setSelectedRole(e.target.value);
    };

    const handleOpenModal = () => {
        setFormData({
            full_name: '',
            email: '',
            password: '',
            phone_number: '',
            class_id: ''
        });
        setSelectedFile(null);
        setImagePreview(null);
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Validate
            if (selectedRole === 'student' && !formData.class_id) throw new Error("Please select a class for the student.");
            if (formData.password.length < 6) throw new Error("Password must be at least 6 characters.");

            // 1. Create Auth Account (Non-persisting)
            const tempSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                { 
                    auth: { 
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false,
                        storageKey: 'temp-auth-storage-' + Date.now() // Absolute isolation
                    } 
                }
            );

            const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.full_name.trim(),
                        role: selectedRole
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Failed to create auth account.");

            // 2. Upload Profile Picture if selected
            let uploadedUrl = null;
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${authData.user.id}/profile.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, selectedFile);
                
                if (uploadError) {
                    console.warn("Avatar upload failed, but profile creation will continue:", uploadError);
                } else {
                    const { data: publicUrlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);
                    uploadedUrl = publicUrlData.publicUrl;
                }
            }

            // 3. Insert Profile
            const profilePayload = {
                id: authData.user.id,
                email: formData.email.trim().toLowerCase(),
                full_name: formData.full_name.trim(),
                role: selectedRole,
                avatar_url: uploadedUrl,
                phone_number: formData.phone_number.trim(),
                class_id: (selectedRole === 'student' || selectedRole === 'candidate') ? formData.class_id : null
            };

            const { error: profileError } = await supabase.from('profiles').insert(profilePayload);
            if (profileError) throw profileError;

            // --- INSTANT CACHE UPDATE ---
            // Refresh invisible background data silently (no flicker)
            await fetchAllData(true);
            
            setSaving(false);
            setIsModalOpen(false);
            alert(`${selectedRole.replace(/_/g, ' ')} created successfully!`);

        } catch (err) {
            alert("Error: " + err.message);
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            setLoading(true);
            await supabase.auth.signOut();
            // Surgical Clear: Only remove superadmin-related cache
            sessionStorage.removeItem('fad_superadmin_profile');
            sessionStorage.removeItem('fad_system_settings');
            sessionStorage.removeItem('fad_all_users_cache');
            
            // Clear verification cache
            localStorage.removeItem('fad_mastro_verified_role_super_admin');
            
            window.location.href = '/portal/superadmin';
        } catch (err) {
            window.location.href = '/portal/superadmin';
        }
    };

    const handleDeleteUser = async (id, name) => {
        const isSelf = id === (await supabase.auth.getUser()).data.user?.id;
        
        const confirmMsg = isSelf 
            ? "WARNING: You are about to delete your own Super Admin account. You will be logged out immediately and lose all access. Proceed?"
            : `Are you sure you want to delete ${name}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            
            if (isSelf) {
                await handleLogout();
                return;
            }

            // Optimistic Local Update
            setAllUsers(prev => ({
                ...prev,
                [selectedRole]: prev[selectedRole].filter(u => u.id !== id)
            }));
        } catch (err) {
            alert("Delete failed: " + err.message);
        }
    };

    return (
        <div className="qe-wrapper">
            
            <div className="qe-container">
                <div className="qe-content-card">
                    <header className="qe-header">
                        <div className="qe-header-left-col">
                            <h1 className="qe-title">Add New User</h1>
                            <p className="qe-subtitle-custom">Manage system access for Students, Candidates, and Admins.</p>
                        </div>
                        
                        <div className="sau-controls">
                            <div className="sau-search-wrapper">
                                <input 
                                    type="text" 
                                    className="sau-search-input" 
                                    placeholder="Search by name or class..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <select 
                                className="sau-role-select"
                                value={selectedRole}
                                onChange={handleRoleChange}
                            >
                                <option value="student">Student</option>
                                <option value="candidate">Candidate</option>
                                <option value="admin">Administrator</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                            
                            <button className="qe-add-new-btn sau-add-btn" onClick={handleOpenModal}>
                                Add New User
                            </button>
                        </div>
                    </header>

                    <main className="qe-questions-list">
                        {fetchError && (
                            <div className="sc-alert sc-alert-error" style={{ margin: '0 32px 20px', textAlign: 'center' }}>
                                ⚠️ {fetchError}
                                <button 
                                    onClick={() => fetchAllData()}
                                    style={{ marginLeft: '10px', textDecoration: 'underline', background: 'none', border: 'none', color: '#9D245A', cursor: 'pointer' }}
                                >
                                    Retry Fetch
                                </button>
                            </div>
                        )}
                        {loading ? (
                            <div className="qe-empty">
                                <div className="qe-spinner"></div>
                                <p>Loading users...</p>
                            </div>
                        ) : allUsers[selectedRole].length === 0 ? (
                            <div className="qe-empty">
                                <span className="qe-empty-icon">👥</span>
                                <p>No {selectedRole.replace(/_/g, ' ')}s found. Use the button above to add one.</p>
                                <button 
                                    className="qe-add-new-btn" 
                                    style={{ marginTop: '16px', fontSize: '12px', background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db' }}
                                    onClick={() => fetchAllData()}
                                >
                                    Check Again
                                </button>
                            </div>
                        ) : (
                            <div className="sau-user-grid">
                                {allUsers[selectedRole]
                                    .filter(u => {
                                        if (!searchTerm) return true;
                                        const search = searchTerm.toLowerCase();
                                        return u.full_name?.toLowerCase().includes(search) || 
                                               u.classes?.class_name?.toLowerCase().includes(search);
                                    })
                                    .map((u) => (
                                    <div key={u.id} className="qe-q-card sau-user-card">
                                        <div className="qe-q-header">
                                            <div className="sau-user-info">
                                                <div className="sau-avatar-circle">
                                                    {u.avatar_url ? (
                                                        <img src={u.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                                                    ) : (
                                                        u.full_name?.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="sau-user-name">{u.full_name}</h3>
                                                    <p className="sau-user-email">{u.email}</p>
                                                </div>
                                            </div>
                                            <div className="qe-q-actions">
                                                <button className="qe-action-btn delete" onClick={() => handleDeleteUser(u.id, u.full_name)}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        {(selectedRole === 'student' || selectedRole === 'candidate') && (
                                            <div className="sau-card-meta">
                                                <span className="sau-meta-tag">Class: {u.classes?.class_name || 'None'}</span>
                                                {u.phone_number && <span className="sau-meta-tag">{u.phone_number}</span>}
                                            </div>
                                        )}
                                        {selectedRole !== 'student' && u.phone_number && (
                                            <div className="sau-card-meta">
                                                <span className="sau-meta-tag">{u.phone_number}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="qe-modal-overlay">
                    <div className="qe-modal">
                        <div className="qe-modal-header">
                            <h2 className="qe-modal-title">Create New {selectedRole.replace(/_/g, ' ').toUpperCase()}</h2>
                        </div>
                        <form className="qe-form" onSubmit={handleSaveUser}>
                            <div className="qe-options-grid sau-form-grid">
                                <div className="qe-form-group">
                                    <label className="qe-label">Full Name*</label>
                                    <input 
                                        type="text" 
                                        className="qe-input" 
                                        required 
                                        placeholder="John Doe"
                                        value={formData.full_name}
                                        onChange={e => setFormData({...formData, full_name: e.target.value})}
                                    />
                                </div>
                                <div className="qe-form-group">
                                    <label className="qe-label">Email Address*</label>
                                    <input 
                                        type="email" 
                                        className="qe-input" 
                                        required 
                                        placeholder="user@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div className="qe-form-group">
                                    <label className="qe-label">Login Password*</label>
                                    <input 
                                        type="password" 
                                        className="qe-input" 
                                        required 
                                        placeholder="Min 6 characters"
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                                <div className="qe-form-group">
                                    <label className="qe-label">Phone Number (Optional)</label>
                                    <input 
                                        type="text" 
                                        className="qe-input" 
                                        placeholder="080..."
                                        value={formData.phone_number}
                                        onChange={e => setFormData({...formData, phone_number: e.target.value})}
                                    />
                                </div>
                                    <div className="qe-form-group full-width">
                                        <label className="qe-label">Profile Picture (Optional)</label>
                                        <div className="sau-file-upload-row">
                                            {imagePreview && (
                                                <div className="sau-preview-box">
                                                    <img src={imagePreview} alt="Preview" />
                                                </div>
                                            )}
                                            <input 
                                                type="file" 
                                                className="qe-input" 
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                style={{ paddingTop: '10px' }}
                                            />
                                        </div>
                                    </div>
                                    {(selectedRole === 'student' || selectedRole === 'candidate') && (
                                        <div className="qe-form-group full-width">
                                            <label className="qe-label">Assigned Class*</label>
                                            <select 
                                                className="qe-input"
                                                required
                                                value={formData.class_id}
                                                onChange={e => setFormData({...formData, class_id: e.target.value})}
                                            >
                                                <option value="">Select Class...</option>
                                                {classes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.class_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                            <div className="qe-modal-footer">
                                <button type="button" className="qe-btn-cancel" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="qe-btn-save" disabled={saving}>
                                    {saving ? 'Creating...' : 'Register User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminUsers;
