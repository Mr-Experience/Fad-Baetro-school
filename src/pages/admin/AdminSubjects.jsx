import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Book, Plus, Trash2, Layers, Search, Bookmark } from 'lucide-react';
import './AdminSubjects.css';

const AdminSubjects = () => {
    // DATA OMNI-FILL: Pulling directly from Layout cache for instant load
    const { classes, subjectsCache, refreshAdminData, classesLoading } = useOutletContext();
    
    const [selectedClassId, setSelectedClassId] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [newSubject, setNewSubject] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    // Initial Selection: Set to first class immediately when classes load
    useEffect(() => {
        if (!selectedClassId && classes && classes.length > 0) {
            setSelectedClassId(classes[0].id);
        }
    }, [classes, selectedClassId]);

    // Cache-Sync: Sync subjects from global cache whenever selectedClassId changes
    useEffect(() => {
        if (selectedClassId && subjectsCache) {
            setSubjects(subjectsCache[selectedClassId] || []);
        } else {
            setSubjects([]);
        }
    }, [selectedClassId, subjectsCache]);

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!newSubject.trim() || !selectedClassId) return;

        setLocalLoading(true);
        try {
            const { error } = await supabase
                .from('subjects')
                .insert([{
                    subject_name: newSubject.trim(),
                    class_id: selectedClassId
                }]);

            if (error) throw error;
            setNewSubject('');
            // Trigger background refresh to sync global cache
            await refreshAdminData();
        } catch (err) {
            alert("Error adding subject: " + err.message);
        } finally {
            setLocalLoading(false);
        }
    };

    const handleDeleteSubject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this subject?")) return;
        setLocalLoading(true);
        try {
            const { error } = await supabase.from('subjects').delete().eq('id', id);
            if (error) throw error;
            await refreshAdminData();
        } catch (err) {
            alert("Error deleting subject: " + err.message);
        } finally {
            setLocalLoading(false);
        }
    };

    const selectedClass = classes.find(c => c.id === selectedClassId);

    return (
        <div className="as-container">
            <div className="as-card">
                <div className="as-header">
                    <div className="as-title-box">
                        <h1 className="as-title">Curriculum Manager</h1>
                        <p className="as-subtitle">Configure subjects for {selectedClass?.class_name || '... '}</p>
                    </div>
                    
                    <div className="as-controls">
                        <div className="as-dropdown-wrap">
                            <Layers size={14} className="as-select-icon" />
                            <select
                                className="as-dropdown"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                disabled={classesLoading}
                            >
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.class_name}</option>
                                ))}
                            </select>
                        </div>

                        <form className="as-add-inline" onSubmit={handleAddSubject}>
                            <input 
                                type="text" 
                                className="as-input-minimal" 
                                placeholder="Add subject (e.g. Physics)" 
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                required
                            />
                            <button type="submit" className="as-add-btn" disabled={localLoading}>
                                {localLoading ? '...' : <><Plus size={18} /> Add</>}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="as-results-info">
                    <div className="as-info-text">
                        <div className="as-info-header">
                            <Bookmark size={18} className="as-info-icon" />
                            <h2>{selectedClass?.class_name} Subjects</h2>
                        </div>
                        <p>Currently teaching {subjects.length} subjects in this class.</p>
                    </div>
                    <span className="as-badge">{subjects.length} Active Records</span>
                </div>

                <div className="as-subjects-grid">
                    {(classesLoading || localLoading) && subjects.length === 0 ? (
                        Array(6).fill(0).map((_, i) => <div key={i} className="as-subject-pill as-skeleton"></div>)
                    ) : subjects.length === 0 ? (
                        <div className="as-empty-state">
                            <Book size={48} />
                            <p>No subjects defined for {selectedClass?.class_name || 'this class'} yet.</p>
                        </div>
                    ) : (
                        subjects.map(sub => (
                            <div key={sub.id} className="as-subject-pill">
                                <div className="as-pill-content">
                                    <div className="as-pill-icon"><Book size={16} /></div>
                                    <span>{sub.subject_name}</span>
                                </div>
                                <button 
                                    className="as-pill-delete" 
                                    onClick={() => handleDeleteSubject(sub.id)}
                                    title="Delete Subject"
                                    disabled={localLoading}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSubjects;
