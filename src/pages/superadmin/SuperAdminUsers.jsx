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

    // Promotion specific state
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [selectedPromoStudents, setSelectedPromoStudents] = useState([]);
    const [targetPromoClassId, setTargetPromoClassId] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [studentReadiness, setStudentReadiness] = useState({}); // { id: { ready: bool, count: num, total: num } }
    const [promoStep, setPromoStep] = useState('list'); // 'list' or 'analyze'

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
            const { error } = await supabase.rpc('delete_user', { target_user_id: id });
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

    const handleOpenPromoModal = async () => {
        const jss3Id = classes.find(c => c.class_name === 'JSS 3')?.id;
        const jss3Students = allUsers.student.filter(s => s.class_id === jss3Id);
        
        if (jss3Students.length === 0) {
            alert("No students currently found in JSS 3 to promote.");
            return;
        }

        setIsPromoModalOpen(true);
        setPromoLoading(true);
        setPromoStep('analyze');

        try {
            // 1. Calculate Previous Session (e.g. 2025/2026 -> 2024/2025)
            const parts = activeSession.split('/');
            const year1 = parseInt(parts[0]);
            const year2 = parseInt(parts[1]);
            const prevSession = (!isNaN(year1) && !isNaN(year2)) 
                ? `${year1 - 1}/${year2 - 1}` 
                : activeSession; // Fallback to current if format is strange
            
            const prevTerm = 'Third Term';

            // 2. Fetch JSS 3 Subjects
            const { data: jss3Subjects } = await supabase.from('subjects').select('id').eq('class_id', jss3Id);
            const totalSubjects = jss3Subjects?.length || 0;

            // 3. Fetch all results for JSS 3 students in PREVIOUS session and PREVIOUS term
            const { data: results } = await supabase
                .from('exam_results')
                .select('student_id, subject_id')
                .eq('class_id', jss3Id)
                .eq('session_id', prevSession)
                .eq('term_id', prevTerm);

            // 4. Map readiness
            const readinessMap = {};
            jss3Students.forEach(student => {
                const studentResults = results?.filter(r => r.student_id === student.id) || [];
                const distinctSubjectsTaken = new Set(studentResults.map(r => r.subject_id)).size;
                
                readinessMap[student.id] = {
                    count: distinctSubjectsTaken,
                    total: totalSubjects,
                    ready: totalSubjects > 0 && distinctSubjectsTaken >= totalSubjects,
                    session: prevSession
                };
            });

            setStudentReadiness(readinessMap);
            // Default select only those who are ready
            setSelectedPromoStudents(jss3Students.filter(s => readinessMap[s.id]?.ready).map(s => s.id));
            setTargetPromoClassId('');
            setPromoStep('list');
        } catch (err) {
            console.error("Readiness check fail:", err);
            alert("Could not verify student exam completion. Please try again.");
            setIsPromoModalOpen(false);
        } finally {
            setPromoLoading(false);
        }
    };

    const handleExecutePromotion = async (e) => {
        e.preventDefault();
        if (!targetPromoClassId) {
            alert("Please select a target SSS 1 department.");
            return;
        }

        if (selectedPromoStudents.length === 0) {
            alert("Please select at least one student to promote.");
            return;
        }

        const targetClass = classes.find(c => c.id === targetPromoClassId);
        if (!window.confirm(`Are you sure you want to promote ${selectedPromoStudents.length} student(s) to ${targetClass?.class_name}?`)) return;

        setPromoLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ class_id: targetPromoClassId })
                .in('id', selectedPromoStudents);

            if (error) throw error;

            alert(`Successfully promoted ${selectedPromoStudents.length} students to ${targetClass?.class_name}.`);
            setIsPromoModalOpen(false);
            await fetchAllData(true);
        } catch (err) {
            alert("Promotion failed: " + err.message);
        } finally {
            setPromoLoading(false);
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
                        {selectedRole === 'student' && !loading && activeTerm === 'First Term' && allUsers.student.some(s => classes.find(c => c.id === s.class_id)?.class_name === 'JSS 3') && (
                            <div className="sau-promo-bar">
                                <div className="sau-avatar-circle" style={{ background: '#F59E0B', width: '36px', height: '36px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <div className="sau-promo-info">
                                    <h4 className="sau-promo-title">New Academic Session: JSS 3 Promotion Required</h4>
                                    <p className="sau-promo-subtitle">Verify that students completed all subjects in Third Term before moving them.</p>
                                </div>
                                <button className="sau-promo-btn" onClick={handleOpenPromoModal}>
                                    Verify & Promote
                                </button>
                            </div>
                        )}
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

            {/* Promotion Modal */}
            {isPromoModalOpen && (
                <div className="qe-modal-overlay">
                    <div className="qe-modal" style={{ maxWidth: '500px' }}>
                        <div className="qe-modal-header">
                            <h2 className="qe-modal-title">BATCH PROMOTION: JSS 3 → SSS 1</h2>
                            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Move students to their assigned departments.</p>
                        </div>
                        
                        <form className="qe-form" onSubmit={handleExecutePromotion}>
                            <div className="promo-student-list" style={{ position: 'relative', minHeight: '100px' }}>
                                {promoStep === 'analyze' ? (
                                    <div className="qe-empty">
                                        <div className="qe-spinner"></div>
                                        <p>Analyzing exam completions...</p>
                                    </div>
                                ) : (
                                    allUsers.student
                                        .filter(s => classes.find(c => c.id === s.class_id)?.class_name === 'JSS 3')
                                        .map(student => {
                                            const stat = studentReadiness[student.id] || { ready: false, count: 0, total: 0 };
                                            return (
                                                <div key={student.id} className="promo-student-item" style={{ opacity: stat.ready ? 1 : 0.7 }}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="promo-checkbox"
                                                        checked={selectedPromoStudents.includes(student.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedPromoStudents([...selectedPromoStudents, student.id]);
                                                            else setSelectedPromoStudents(selectedPromoStudents.filter(id => id !== student.id));
                                                        }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div className="promo-student-name">{student.full_name}</div>
                                                        <div className="promo-student-email">{student.email}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{ 
                                                            fontSize: '11px', 
                                                            padding: '2px 8px', 
                                                            borderRadius: '10px',
                                                            background: stat.ready ? '#DCFCE7' : '#F1F5F9',
                                                            color: stat.ready ? '#166534' : '#64748B',
                                                            fontWeight: '700'
                                                        }}>
                                                            {stat.count} / {stat.total} EXAMS
                                                        </span>
                                                        <div style={{ fontSize: '10px', color: stat.ready ? '#166534' : '#94A3B8', marginTop: '2px' }}>
                                                            {stat.ready ? '✓ READY' : 'PENDING'}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>

                            <div className="promo-target-section">
                                <label className="promo-target-label">SELECT TARGET SSS 1 DEPARTMENT*</label>
                                <select 
                                    className="qe-input"
                                    required
                                    value={targetPromoClassId}
                                    onChange={e => setTargetPromoClassId(e.target.value)}
                                >
                                    <option value="">Select Destination...</option>
                                    {classes
                                        .filter(c => c.class_name.startsWith('SSS 1'))
                                        .map(c => (
                                            <option key={c.id} value={c.id}>{c.class_name}</option>
                                        ))}
                                </select>
                            </div>

                            <div className="qe-modal-footer">
                                <button type="button" className="qe-btn-cancel" onClick={() => setIsPromoModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="qe-btn-save" disabled={promoLoading || selectedPromoStudents.length === 0}>
                                    {promoLoading ? 'Promoting...' : `Promote ${selectedPromoStudents.length} Student(s)`}
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
