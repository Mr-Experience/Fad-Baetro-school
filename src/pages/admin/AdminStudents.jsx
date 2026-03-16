import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createClient, supabase } from '../../supabaseClient';
import './AdminStudents.css';

const AdminStudents = () => {
    const { classes, studentsCache, refreshAdminData } = useOutletContext();
    const [students, setStudents] = useState(studentsCache || []);
    const [loading, setLoading] = useState(!studentsCache);
    const [filterClass, setFilterClass] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editFormData, setEditFormData] = useState({
        full_name: '',
        phone_number: '',
        class_id: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (studentsCache) {
            setStudents(studentsCache);
            setLoading(false);
        } else {
            setLoading(true);
            refreshAdminData().finally(() => setLoading(false));
        }
    }, [studentsCache]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        try {
            const { error } = await supabase.rpc('delete_user', { target_user_id: id });
            if (error) throw error;
            setStudents(prev => prev.filter(s => s.id !== id));
            refreshAdminData().catch(() => {});
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    const handleOpenEdit = (student) => {
        setSelectedStudent(student);
        setEditFormData({
            full_name: student.full_name || '',
            phone_number: student.phone_number || '',
            class_id: student.class_id || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!selectedStudent) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editFormData.full_name,
                    phone_number: editFormData.phone_number,
                    class_id: editFormData.class_id
                })
                .eq('id', selectedStudent.id);

            if (error) throw error;

            setStudents(prev => prev.map(s => 
                s.id === selectedStudent.id 
                    ? { ...s, ...editFormData } 
                    : s
            ));
            
            setIsEditModalOpen(false);
            refreshAdminData().catch(() => {});
            alert('Student updated successfully!');
        } catch (err) {
            alert('Update failed: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const getClassName = (classId) => {
        return classes.find(c => c.id === classId)?.class_name || 'N/A';
    };

    const filteredStudents = students.filter(s => {
        const matchesClass = filterClass === 'all' || s.class_id === filterClass;
        const matchesSearch = !searchTerm || 
            s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getClassName(s.class_id).toLowerCase().includes(searchTerm.toLowerCase());
        return matchesClass && matchesSearch;
    });

    return (
        <div className="as-container">
            <div className="as-card">
                <div className="as-header">
                    <h1 className="as-title">Registered Students</h1>
                    <div className="as-controls">
                        <div className="as-search-wrapper">
                            <input 
                                type="text" 
                                className="as-input as-search-input" 
                                placeholder="Search by name, email or class..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
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
                            {/* VISIBILITY GUARD: Maintain STABLE height and presence during sync */}
                            {loading && students.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="as-empty-state">
                                        <div className="aq-spinner-mini"></div>
                                        <p>Contacting student registry...</p>
                                    </td>
                                </tr>
                            ) : filteredStudents.length > 0 ? (
                                filteredStudents.map(student => (
                                    <tr key={student.id}>
                                        <td className="as-student-name">{student.full_name}</td>
                                        <td className="as-student-email">{student.email}</td>
                                        <td><span className="as-badge">{getClassName(student.class_id)}</span></td>
                                        <td>{student.phone_number || '-'}</td>
                                        <td>{new Date(student.created_at).toLocaleDateString()}</td>
                                         <td>
                                             <div className="as-actions">
                                                 <button className="as-action-btn view" title="View Profile"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></button>
                                                 <button className="as-action-btn edit" title="Edit Profile" onClick={() => handleOpenEdit(student)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                                                 <button className="as-action-btn delete" title="Delete Student" onClick={() => handleDelete(student.id)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg></button>
                                             </div>
                                         </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="as-empty-state">
                                        <div className="as-empty-icon">👥</div>
                                        <p>{loading ? "Refreshing student list..." : "No students found for this search/filter."}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="as-modal-overlay">
                    <div className="as-modal">
                        <div className="as-modal-header">
                            <h2 className="as-modal-title">Edit Student Details</h2>
                            <p className="as-modal-subtitle">Modify profile information for {selectedStudent?.full_name}</p>
                        </div>
                        <form className="as-modal-form" onSubmit={handleSaveEdit}>
                            <div className="as-modal-grid">
                                <div className="as-form-group full-width">
                                    <label className="as-label">Full Name*</label>
                                    <input 
                                        type="text" 
                                        className="as-input" 
                                        required
                                        value={editFormData.full_name}
                                        onChange={e => setEditFormData({...editFormData, full_name: e.target.value})}
                                    />
                                </div>
                                <div className="as-form-group">
                                    <label className="as-label">Phone Number (Optional)</label>
                                    <input 
                                        type="text" 
                                        className="as-input" 
                                        placeholder="080..."
                                        value={editFormData.phone_number}
                                        onChange={e => setEditFormData({...editFormData, phone_number: e.target.value})}
                                    />
                                </div>
                                <div className="as-form-group">
                                    <label className="as-label">Assigned Class*</label>
                                    <select 
                                        className="as-input"
                                        required
                                        value={editFormData.class_id}
                                        onChange={e => setEditFormData({...editFormData, class_id: e.target.value})}
                                    >
                                        <option value="">Select Class...</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.class_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="as-modal-footer">
                                <button type="button" className="as-btn-cancel" onClick={() => setIsEditModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="as-btn-save" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
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
