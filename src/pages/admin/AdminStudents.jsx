import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createClient, supabase } from '../../supabaseClient';
import './AdminStudents.css';

const AdminStudents = () => {
    const { classes, studentsCache, refreshAdminData } = useOutletContext();
    const [students, setStudents] = useState(studentsCache || []);
    const [loading, setLoading] = useState(!studentsCache);
    const [filterClass, setFilterClass] = useState('all');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        class_id: '',
        password: '',
        profile_image: null
    });

    // Clear form when modal opens or closes
    useEffect(() => {
        if (!showModal) {
            setFormData({ full_name: '', email: '', phone_number: '', class_id: '', password: '', profile_image: null });
            setSuccessMessage('');
        }
    }, [showModal]);

    useEffect(() => {
        if (studentsCache) {
            setStudents(studentsCache);
            setLoading(false);
        } else {
            setLoading(true);
            refreshAdminData().finally(() => setLoading(false));
        }
    }, [studentsCache]);

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (!formData.class_id) throw new Error("Please select a class.");
            if (formData.password?.length < 6) throw new Error("Password must be at least 6 characters.");

            const emailExists = students.some(s => s.email.toLowerCase() === formData.email.trim().toLowerCase());
            if (emailExists) throw new Error("A student with this email already exists.");

            let profileImageUrl = null;
            if (formData.profile_image) {
                const file = formData.profile_image;
                const fileName = `student_${Date.now()}.${file.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
                profileImageUrl = publicUrl;
            }

            const tempSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
            );

            const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                options: { data: { full_name: formData.full_name.trim(), role: 'student' } }
            });

            if (authError) throw authError;

            const { data: inserted, error: profileError } = await supabase.from('profiles').insert({
                id: authData.user?.id,
                email: formData.email.trim().toLowerCase(),
                full_name: formData.full_name.trim(),
                role: 'student',
                class_id: formData.class_id,
                phone_number: formData.phone_number.trim(),
                avatar_url: profileImageUrl,
            }).select('*, classes(class_name)').single();

            if (profileError) throw profileError;

            setStudents(prev => [inserted, ...prev]);
            setSuccessMessage('Student added successfully!');
            setTimeout(() => {
                setShowModal(false);
                refreshAdminData().catch(() => {});
            }, 1200);

        } catch (err) {
            console.error("Add student error:", err);
            alert('Error adding student: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            setStudents(prev => prev.filter(s => s.id !== id));
            refreshAdminData().catch(() => {});
        } catch (err) {
            alert('Failed to delete: ' + error.message);
        }
    };

    const filteredStudents = filterClass === 'all'
        ? students
        : students.filter(s => s.class_id === filterClass);

    return (
        <div className="as-container">
            <div className="as-card">
                <div className="as-header">
                    <h1 className="as-title">Registered Students</h1>
                    <div className="as-controls">
                        <select
                            className="as-dropdown"
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                        >
                            <option value="all">All Classes</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.class_name}</option>
                            ))}
                        </select>
                        <button className="as-add-btn" onClick={() => setShowModal(true)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Add Student
                        </button>
                    </div>
                </div>

                <div className="as-table-wrapper">
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Email Address</th>
                                <th>Assigned Class</th>
                                <th>Phone Number</th>
                                <th>Date Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="as-empty-state">Loading Registry...</td></tr>
                            ) : filteredStudents.length > 0 ? (
                                filteredStudents.map(student => (
                                    <tr key={student.id}>
                                        <td className="as-student-name">{student.full_name}</td>
                                        <td className="as-student-email">{student.email}</td>
                                        <td><span className="as-badge">{student.classes?.class_name || 'N/A'}</span></td>
                                        <td>{student.phone_number || '-'}</td>
                                        <td>{new Date(student.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="as-actions">
                                                <button className="as-action-btn view" title="View Profile"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></button>
                                                <button className="as-action-btn edit" title="Edit Profile"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                                                <button className="as-action-btn delete" title="Delete Student" onClick={() => handleDelete(student.id)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="as-empty-state">
                                        <div className="as-empty-icon">👥</div>
                                        <p>No students found for this filter.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Student Modal */}
            {showModal && (
                <div className="as-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="as-modal" onClick={e => e.stopPropagation()}>
                        <h2 className="as-modal-title">Create Student Account</h2>
                        <p className="as-modal-subtitle">Add a new student to the academic registry.</p>

                        {successMessage && (
                            <div className="as-success-banner">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleAddStudent} autoComplete="off">
                            <div className="as-form-row">
                                <div className="as-form-group">
                                    <label className="as-label">Full Name*</label>
                                    <input
                                        type="text"
                                        className="as-input"
                                        required
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="as-form-group">
                                    <label className="as-label">Profile Avatar</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="as-input"
                                        onChange={e => setFormData({ ...formData, profile_image: e.target.files[0] })}
                                    />
                                </div>
                            </div>

                            <div className="as-form-row">
                                <div className="as-form-group">
                                    <label className="as-label">Email Address*</label>
                                    <input
                                        type="email"
                                        className="as-input"
                                        required
                                        autoComplete="new-email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="as-form-group">
                                    <label className="as-label">Phone Number</label>
                                    <input
                                        type="text"
                                        className="as-input"
                                        value={formData.phone_number}
                                        onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="as-form-row">
                                <div className="as-form-group">
                                    <label className="as-label">Class Allocation*</label>
                                    <select
                                        className="as-input"
                                        required
                                        value={formData.class_id}
                                        onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.class_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="as-form-group">
                                    <label className="as-label">Login Password*</label>
                                    <input
                                        type="password"
                                        className="as-input"
                                        required
                                        autoComplete="new-password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="as-modal-actions">
                                <button type="button" className="as-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="as-btn-save" disabled={saving}>
                                    {saving ? 'Processing...' : 'Register Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStudents;
