import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Book, Plus, Trash2, Search, Layers } from 'lucide-react';
import './AdminSubjects.css';

const AdminSubjects = () => {
    const { classes, subjectsCache, setSubjectsCache } = useOutletContext();
    const [selectedClass, setSelectedClass] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch subjects when selected class changes
    useEffect(() => {
        if (selectedClass) {
            fetchSubjects();
        } else if (classes && classes.length > 0) {
            setSelectedClass(classes[0]);
        }
    }, [selectedClass, classes]);

    const fetchSubjects = async () => {
        if (!selectedClass) return;

        // Check cache
        if (subjectsCache[selectedClass.id]) {
            setSubjects(subjectsCache[selectedClass.id]);
            // Still fetch in background to keep it fresh, but don't show loader
        } else {
            setLoading(true);
        }

        try {
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .eq('class_id', selectedClass.id)
                .order('subject_name');
            
            if (error) throw error;
            const fetchedSubjects = data || [];
            setSubjects(fetchedSubjects);
            setSubjectsCache(prev => ({ ...prev, [selectedClass.id]: fetchedSubjects }));
        } catch (err) {
            console.error("Error fetching subjects:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!newSubject.trim() || !selectedClass) return;

        try {
            const { error } = await supabase
                .from('subjects')
                .insert([{
                    subject_name: newSubject.trim(),
                    class_id: selectedClass.id
                }]);

            if (error) throw error;
            
            setNewSubject('');
            fetchSubjects();
        } catch (err) {
            alert("Error adding subject: " + err.message);
        }
    };

    const handleDeleteSubject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this subject?")) return;

        try {
            const { error } = await supabase
                .from('subjects')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchSubjects();
        } catch (err) {
            alert("Error deleting subject: " + err.message);
        }
    };

    const filteredClasses = classes?.filter(c => 
        c.class_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="as-container">
            <div className="as-white-screen">
                <header className="as-header">
                    <h1>Manage Subjects</h1>
                    <p>Add and organize academic subjects for each class level.</p>
                </header>

                <div className="as-content-grid">
                    {/* Left Side: Class Selection */}
                    <div className="as-card">
                        <div className="as-card-header">
                            <h2><Layers size={18} /> Classes</h2>
                        </div>
                        <div style={{ padding: '15px', borderBottom: '1px solid #f3f4f6' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input 
                                    type="text" 
                                    className="as-input" 
                                    style={{ paddingLeft: '35px' }} 
                                    placeholder="Search classes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="as-class-list">
                            {filteredClasses.map(cls => (
                                <div 
                                    key={cls.id} 
                                    className={`as-class-item ${selectedClass?.id === cls.id ? 'active' : ''}`}
                                    onClick={() => setSelectedClass(cls)}
                                >
                                    <span className="as-class-name">{cls.class_name}</span>
                                    {selectedClass?.id === cls.id && <Plus size={16} color="#9D245A" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Subjects Management */}
                    <div className="as-subject-view">
                        {selectedClass ? (
                            <>
                                <div className="as-card">
                                    <div className="as-card-header">
                                        <h2><Book size={18} /> Subjects for {selectedClass.class_name}</h2>
                                        <span style={{ fontSize: '13px', color: '#6b7280' }}>{subjects.length} Subjects Total</span>
                                    </div>
                                    <div style={{ padding: '20px' }}>
                                        <form className="as-add-form" onSubmit={handleAddSubject}>
                                            <input 
                                                type="text" 
                                                className="as-input" 
                                                placeholder="Enter new subject name..." 
                                                value={newSubject}
                                                onChange={(e) => setNewSubject(e.target.value)}
                                                required
                                            />
                                            <button type="submit" className="as-add-btn">
                                                <Plus size={18} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                                                Add Subject
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                <div className="as-subjects-grid">
                                    {loading ? (
                                        <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '40px' }}>Loading subjects...</div>
                                    ) : subjects.length === 0 ? (
                                        <div className="as-card" style={{ gridColumn: '1/-1' }}>
                                            <div className="as-empty">
                                                <Book size={48} className="as-empty-icon" />
                                                <p>No subjects added for this class yet.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        subjects.map(sub => (
                                            <div key={sub.id} className="as-subject-card">
                                                <div className="as-subject-info">
                                                    <div className="as-subject-icon">
                                                        <Book size={18} />
                                                    </div>
                                                    <span className="as-subject-name">{sub.subject_name}</span>
                                                </div>
                                                <div className="as-delete-btn" onClick={() => handleDeleteSubject(sub.id)}>
                                                    <Trash2 size={16} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="as-card">
                                <div className="as-empty">
                                    <p>Select a class from the left to manage its subjects.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSubjects;
