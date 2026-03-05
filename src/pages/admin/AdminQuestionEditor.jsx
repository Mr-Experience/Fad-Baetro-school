import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './AdminQuestionEditor.css';

const AdminQuestionEditor = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const classId = searchParams.get('classId') || '';
    const subjectId = searchParams.get('subjectId') || '';
    const className = searchParams.get('className') || 'Unknown Class';
    const subjectName = searchParams.get('subjectName') || 'Unknown Subject';
    const questionType = searchParams.get('type') || 'test';

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSession, setActiveSession] = useState('');
    const [activeTerm, setActiveTerm] = useState('');

    const [form, setForm] = useState({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // Get session/term
                const { data: sys } = await supabase.from('school_settings').select('current_session, current_term').single();
                if (sys) {
                    setActiveSession(sys.current_session || '');
                    setActiveTerm(sys.current_term || '');
                } else {
                    // Fallback to system_settings if school_settings fails
                    const { data: sys2 } = await supabase.from('system_settings').select('current_session, current_term').single();
                    if (sys2) {
                        setActiveSession(sys2.current_session || '');
                        setActiveTerm(sys2.current_term || '');
                    }
                }

                // Fetch questions
                if (classId && subjectId) {
                    const { data } = await supabase
                        .from('questions')
                        .select('*')
                        .eq('class_id', classId)
                        .eq('subject_id', subjectId)
                        .eq('question_type', questionType)
                        .order('created_at', { ascending: true });
                    if (data) setQuestions(data);
                }
            } catch (err) {
                console.error("Initiation error:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [classId, subjectId, questionType]);

    const handleEdit = (q) => {
        setForm({
            question_text: q.question_text || '',
            option_a: q.option_a || '',
            option_b: q.option_b || '',
            option_c: q.option_c || '',
            option_d: q.option_d || '',
            correct_answer: q.correct_answer || ''
        });
        setEditingId(q.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleClear = () => {
        setForm({
            question_text: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            correct_answer: ''
        });
        setEditingId(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.correct_answer) {
            alert("Please select the correct answer.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                class_id: classId,
                subject_id: subjectId,
                session_id: activeSession,
                term_id: activeTerm,
                question_type: questionType,
                question_text: form.question_text,
                option_a: form.option_a,
                option_b: form.option_b,
                option_c: form.option_c,
                option_d: form.option_d,
                options: JSON.stringify({ a: form.option_a, b: form.option_b, c: form.option_c, d: form.option_d }),
                correct_answer: form.correct_answer,
                correct_option: form.correct_answer
            };

            if (editingId) {
                const { error } = await supabase.from('questions').update(payload).eq('id', editingId);
                if (error) throw error;
                setQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...payload } : q));
                alert("Question updated successfully!");
                handleClear();
            } else {
                const { data, error } = await supabase.from('questions').insert(payload).select().single();
                if (error) throw error;
                if (data) setQuestions(prev => [...prev, data]);
                alert("Question saved successfully!");
                handleClear();
            }
        } catch (err) {
            alert("Error saving: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this question?")) return;
        try {
            const { error } = await supabase.from('questions').delete().eq('id', id);
            if (error) throw error;
            setQuestions(prev => prev.filter(q => q.id !== id));
            if (editingId === id) handleClear();
        } catch (err) {
            alert("Delete failed: " + err.message);
        }
    };

    return (
        <div className="qe-container">
            {/* Top Bar */}
            <div className="qe-topbar">
                <div className="qe-topbar-left">
                    <button className="qe-back-btn" onClick={() => navigate('/portal/admin/questions')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="qe-topbar-title-group">
                        <span className="qe-topbar-logo">FAD MAESTRO</span>
                        <span className="qe-topbar-title">Question Bank Editor</span>
                    </div>
                    <div className="qe-topbar-tags">
                        <span className="qe-tag class">{className}</span>
                        <span className="qe-tag subject">{subjectName}</span>
                        <span className="qe-tag type">{questionType}</span>
                    </div>
                </div>
                <div className="qe-topbar-right">
                    <div className="qe-stats">
                        <strong>{questions.length}</strong> Questions Total
                    </div>
                </div>
            </div>

            <main className="qe-body">
                {/* Left Side: Question List */}
                <section className="qe-list-section">
                    <div className="qe-section-header">
                        <h2 className="qe-section-title">Question Manuscript</h2>
                        <div className="qe-list-actions">
                            <span className="qe-helper-text">Click cards to edit</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="qe-loading">
                            <div className="qe-spinner"></div>
                            <p>Loading your questions...</p>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="qe-empty-state">
                            <span className="qe-empty-icon">📝</span>
                            <h3>No questions yet</h3>
                            <p>Use the panel on the right to add your first question.</p>
                        </div>
                    ) : (
                        <div className="qe-questions-grid">
                            {questions.map((q, i) => (
                                <div
                                    key={q.id}
                                    className={`qe-q-card ${editingId === q.id ? 'editing' : ''}`}
                                    onClick={() => handleEdit(q)}
                                >
                                    <div className="qe-q-header">
                                        <div className="qe-q-num">Q{i + 1}</div>
                                        <div className="qe-q-actions">
                                            <button className="qe-q-btn edit" onClick={(e) => { e.stopPropagation(); handleEdit(q); }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button className="qe-q-btn delete" onClick={(e) => handleDelete(e, q.id)}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="qe-q-text">{q.question_text}</p>
                                    <div className="qe-options-list">
                                        {['a', 'b', 'c', 'd'].map(opt => (
                                            <div key={opt} className={`qe-opt-item ${q.correct_answer === opt.toUpperCase() ? 'correct' : ''}`}>
                                                <div className="qe-opt-indicator"></div>
                                                <span className="qe-opt-label">{opt.toUpperCase()}.</span>
                                                <span className="qe-opt-val">{q[`option_${opt}`]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Right Side: Editor Panel */}
                <aside className="qe-editor-panel">
                    <div className="qe-form-card">
                        <h2 className="qe-form-title">
                            <span className="qe-title-icon">{editingId ? '✍️' : '➕'}</span>
                            {editingId ? 'Edit Question' : 'Add New Question'}
                        </h2>
                        <form onSubmit={handleSave}>
                            <div className="qe-form-group">
                                <label className="qe-label">Question Text</label>
                                <textarea
                                    className="qe-textarea"
                                    placeholder="Type the question content here..."
                                    rows="4"
                                    required
                                    value={form.question_text}
                                    onChange={e => setForm({ ...form, question_text: e.target.value })}
                                />
                            </div>

                            <div className="qe-form-group">
                                <label className="qe-label">Options</label>
                                <div className="qe-opt-input-grid">
                                    {['a', 'b', 'c', 'd'].map(opt => (
                                        <div key={opt} className="qe-opt-input-wrap">
                                            <span className="qe-opt-prefix">{opt.toUpperCase()}</span>
                                            <input
                                                type="text"
                                                className="qe-input"
                                                placeholder={`Option ${opt.toUpperCase()}...`}
                                                required
                                                value={form[`option_${opt}`]}
                                                onChange={e => setForm({ ...form, [`option_${opt}`]: e.target.value })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="qe-form-group">
                                <label className="qe-label">Correct Answer</label>
                                <div className="qe-correct-picker">
                                    {['A', 'B', 'C', 'D'].map(ans => (
                                        <button
                                            key={ans}
                                            type="button"
                                            className={`qe-correct-btn ${form.correct_answer === ans ? 'selected' : ''}`}
                                            onClick={() => setForm({ ...form, correct_answer: ans })}
                                        >
                                            {ans}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="qe-save-btn" disabled={saving}>
                                {saving ? (
                                    <>
                                        <div className="qe-spinner-small"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                                        </svg>
                                        {editingId ? 'Update Question' : 'Save Question'}
                                    </>
                                )}
                            </button>

                            {editingId && (
                                <button type="button" className="qe-clear-btn" onClick={handleClear}>
                                    Cancel & Create New
                                </button>
                            )}
                        </form>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default AdminQuestionEditor;
