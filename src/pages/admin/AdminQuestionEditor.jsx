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
        <div className="simple-editor-container">
            <header className="simple-editor-header">
                <div>
                    <button onClick={() => navigate('/portal/admin/questions')} className="back-button">
                        ← Back to Management
                    </button>
                    <h2>{className} - {subjectName} ({questionType.toUpperCase()})</h2>
                    <p>Total Questions: {questions.length}</p>
                </div>
                <button className="add-btn" onClick={() => handleOpenModal()}>
                    + Add New Question
                </button>
            </header>

            {loading ? (
                <div className="loading">Loading questions...</div>
            ) : (
                <div className="questions-list">
                    {questions.length === 0 ? (
                        <div className="empty-state">
                            No questions found. Click '+ Add New Question' to start.
                        </div>
                    ) : (
                        questions.map((q, i) => (
                            <div key={q.id} className="question-card">
                                <div className="q-head">
                                    <span className="q-num">Q{i + 1}</span>
                                    <div className="q-actions">
                                        <button onClick={() => handleOpenModal(q)}>Edit</button>
                                        <button onClick={() => handleDelete(q.id)} className="del-btn">Delete</button>
                                    </div>
                                </div>
                                <p className="q-text">{q.question_text}</p>
                                <ul className="q-options">
                                    <li className={q.correct_answer === 'A' ? 'correct' : ''}>
                                        <strong>A.</strong> {q.option_a}
                                    </li>
                                    <li className={q.correct_answer === 'B' ? 'correct' : ''}>
                                        <strong>B.</strong> {q.option_b}
                                    </li>
                                    <li className={q.correct_answer === 'C' ? 'correct' : ''}>
                                        <strong>C.</strong> {q.option_c}
                                    </li>
                                    <li className={q.correct_answer === 'D' ? 'correct' : ''}>
                                        <strong>D.</strong> {q.option_d}
                                    </li>
                                </ul>
                            </div>
                        ))
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingId ? 'Edit Question' : 'Add New Question'}</h3>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Question Content</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={form.question_text}
                                    onChange={e => setForm({ ...form, question_text: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Option A</label>
                                <input required type="text" value={form.option_a} onChange={e => setForm({ ...form, option_a: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Option B</label>
                                <input required type="text" value={form.option_b} onChange={e => setForm({ ...form, option_b: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Option C</label>
                                <input required type="text" value={form.option_c} onChange={e => setForm({ ...form, option_c: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Option D</label>
                                <input required type="text" value={form.option_d} onChange={e => setForm({ ...form, option_d: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Correct Answer</label>
                                <select required value={form.correct_answer} onChange={e => setForm({ ...form, correct_answer: e.target.value })}>
                                    <option value="">--Select Correct Option--</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={handleCloseModal} className="cancel-btn">Cancel</button>
                                <button type="submit" disabled={saving} className="save-btn">
                                    {saving ? 'Saving...' : 'Save Question'}
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
