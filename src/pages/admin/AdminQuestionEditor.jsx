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
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                const { data: sys } = await supabase.from('system_settings').select('current_session, current_term').single();
                if (sys) {
                    setActiveSession(sys.current_session || '');
                    setActiveTerm(sys.current_term || '');
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

    const handleOpenModal = (q = null) => {
        if (q) {
            setForm({
                question_text: q.question_text || '',
                option_a: q.option_a || '',
                option_b: q.option_b || '',
                option_c: q.option_c || '',
                option_d: q.option_d || '',
                correct_answer: q.correct_answer || ''
            });
            setEditingId(q.id);
        } else {
            setForm({
                question_text: '',
                option_a: '',
                option_b: '',
                option_c: '',
                option_d: '',
                correct_answer: ''
            });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
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
                // Update local list
                setQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...payload } : q));
            } else {
                const { data, error } = await supabase.from('questions').insert(payload).select().single();
                if (error) throw error;
                // Add to local list
                if (data) setQuestions(prev => [...prev, data]);
            }
            handleCloseModal();
        } catch (err) {
            alert("Error saving: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this question?")) return;
        try {
            const { error } = await supabase.from('questions').delete().eq('id', id);
            if (error) throw error;
            setQuestions(prev => prev.filter(q => q.id !== id));
        } catch (err) {
            alert("Delete failed: " + err.message);
        }
    };

    return (
        <div className="aq-editor-container">
            <div className="aq-editor-header">
                <div className="aq-editor-header-left">
                    <button className="aq-editor-back-btn" onClick={() => navigate('/portal/admin/questions')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5" />
                            <path d="M12 19l-7-7 7-7" />
                        </svg>
                        Back to Questions
                    </button>
                    <div className="aq-editor-title">
                        <h1>{className} - {subjectName}</h1>
                        <span className="aq-editor-type">{questionType.toUpperCase()} Questions</span>
                    </div>
                </div>
                <div className="aq-editor-header-right">
                    <div className="aq-editor-stats">
                        <span>Total: {questions.length}</span>
                    </div>
                    <button className="aq-editor-add-btn" onClick={() => handleOpenModal()}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14" />
                            <path d="M5 12h14" />
                        </svg>
                        Add Question
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="aq-editor-loading">
                    <div className="aq-editor-spinner"></div>
                    <p>Loading questions...</p>
                </div>
            ) : (
                <div className="aq-editor-content">
                    {questions.length === 0 ? (
                        <div className="aq-editor-empty">
                            <div className="aq-editor-empty-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M9 11l3 3L22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                            </div>
                            <h3>No questions found</h3>
                            <p>Click the "Add Question" button to create your first question.</p>
                        </div>
                    ) : (
                        <div className="aq-editor-questions">
                            {questions.map((q, i) => (
                                <div key={q.id} className="aq-editor-question-card">
                                    <div className="aq-editor-question-header">
                                        <span className="aq-editor-question-number">Q{i + 1}</span>
                                        <div className="aq-editor-question-actions">
                                            <button
                                                className="aq-editor-btn aq-editor-btn-edit"
                                                onClick={() => handleOpenModal(q)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                className="aq-editor-btn aq-editor-btn-delete"
                                                onClick={() => handleDelete(q.id)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 6h18" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="aq-editor-question-content">
                                        <p className="aq-editor-question-text">{q.question_text}</p>
                                        <div className="aq-editor-options">
                                            <div className={`aq-editor-option ${q.correct_answer === 'A' ? 'correct' : ''}`}>
                                                <span className="aq-editor-option-label">A.</span>
                                                <span className="aq-editor-option-text">{q.option_a}</span>
                                            </div>
                                            <div className={`aq-editor-option ${q.correct_answer === 'B' ? 'correct' : ''}`}>
                                                <span className="aq-editor-option-label">B.</span>
                                                <span className="aq-editor-option-text">{q.option_b}</span>
                                            </div>
                                            <div className={`aq-editor-option ${q.correct_answer === 'C' ? 'correct' : ''}`}>
                                                <span className="aq-editor-option-label">C.</span>
                                                <span className="aq-editor-option-text">{q.option_c}</span>
                                            </div>
                                            <div className={`aq-editor-option ${q.correct_answer === 'D' ? 'correct' : ''}`}>
                                                <span className="aq-editor-option-label">D.</span>
                                                <span className="aq-editor-option-text">{q.option_d}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="aq-editor-modal-overlay">
                    <div className="aq-editor-modal">
                        <div className="aq-editor-modal-header">
                            <h3>{editingId ? 'Edit Question' : 'Add New Question'}</h3>
                            <button
                                type="button"
                                className="aq-editor-modal-close"
                                onClick={handleCloseModal}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="aq-editor-modal-form">
                            <div className="aq-editor-form-group">
                                <label className="aq-editor-form-label">Question Content</label>
                                <textarea
                                    required
                                    rows="4"
                                    className="aq-editor-form-textarea"
                                    value={form.question_text}
                                    onChange={e => setForm({ ...form, question_text: e.target.value })}
                                    placeholder="Enter your question here..."
                                />
                            </div>
                            <div className="aq-editor-form-row">
                                <div className="aq-editor-form-group">
                                    <label className="aq-editor-form-label">Option A</label>
                                    <input
                                        required
                                        type="text"
                                        className="aq-editor-form-input"
                                        value={form.option_a}
                                        onChange={e => setForm({ ...form, option_a: e.target.value })}
                                        placeholder="Enter option A"
                                    />
                                </div>
                                <div className="aq-editor-form-group">
                                    <label className="aq-editor-form-label">Option B</label>
                                    <input
                                        required
                                        type="text"
                                        className="aq-editor-form-input"
                                        value={form.option_b}
                                        onChange={e => setForm({ ...form, option_b: e.target.value })}
                                        placeholder="Enter option B"
                                    />
                                </div>
                            </div>
                            <div className="aq-editor-form-row">
                                <div className="aq-editor-form-group">
                                    <label className="aq-editor-form-label">Option C</label>
                                    <input
                                        required
                                        type="text"
                                        className="aq-editor-form-input"
                                        value={form.option_c}
                                        onChange={e => setForm({ ...form, option_c: e.target.value })}
                                        placeholder="Enter option C"
                                    />
                                </div>
                                <div className="aq-editor-form-group">
                                    <label className="aq-editor-form-label">Option D</label>
                                    <input
                                        required
                                        type="text"
                                        className="aq-editor-form-input"
                                        value={form.option_d}
                                        onChange={e => setForm({ ...form, option_d: e.target.value })}
                                        placeholder="Enter option D"
                                    />
                                </div>
                            </div>
                            <div className="aq-editor-form-group">
                                <label className="aq-editor-form-label">Correct Answer</label>
                                <select
                                    required
                                    className="aq-editor-form-select"
                                    value={form.correct_answer}
                                    onChange={e => setForm({ ...form, correct_answer: e.target.value })}
                                >
                                    <option value="">--Select Correct Option--</option>
                                    <option value="A">A - {form.option_a}</option>
                                    <option value="B">B - {form.option_b}</option>
                                    <option value="C">C - {form.option_c}</option>
                                    <option value="D">D - {form.option_d}</option>
                                </select>
                            </div>
                            <div className="aq-editor-modal-actions">
                                <button
                                    type="button"
                                    className="aq-editor-btn aq-editor-btn-cancel"
                                    onClick={handleCloseModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="aq-editor-btn aq-editor-btn-save"
                                >
                                    {saving ? (
                                        <>
                                            <div className="aq-editor-spinner-small"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        editingId ? 'Update Question' : 'Save Question'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminQuestionEditor;
