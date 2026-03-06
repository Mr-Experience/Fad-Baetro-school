import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminHeader from '../../components/AdminHeader';
import './AdminQuestionEditor.css';

const AdminQuestionEditor = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const classId = searchParams.get('classId') || '';
    const subjectId = searchParams.get('subjectId') || '';
    const className = searchParams.get('className') || 'Unknown Class';
    const subjectName = searchParams.get('subjectName') || 'Unknown Subject';
    const questionType = searchParams.get('type') || 'test';

    const [userId, setUserId] = useState('');

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSession, setActiveSession] = useState('');
    const [activeTerm, setActiveTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Profile state for header
    const [userName, setUserName] = useState('');
    const [userInitial, setUserInitial] = useState('A');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    const [form, setForm] = useState({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // 1. SILENT AUTH CHECK
                let { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    await new Promise(r => setTimeout(r, 800));
                    const retry = await supabase.auth.getSession();
                    session = retry.data.session;
                }
                if (!session) {
                    navigate('/portal/admin/login', { state: { from: window.location.pathname + window.location.search } });
                    return;
                }

                // Verify Role
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
                if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
                    navigate('/portal/admin/login');
                    return;
                }

                // 2. Fetch DATA (Session/Term)
                const { data: settings } = await supabase
                    .from('system_settings')
                    .select('current_session, current_term')
                    .eq('id', 1)
                    .single();

                if (settings) {
                    setActiveSession(settings.current_session || '');
                    setActiveTerm(settings.current_term || '');
                }

                // Restore Profile Data
                setUserId(session.user.id);
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', session.user.id)
                    .single();

                if (profileData) {
                    setUserName(profileData.full_name || session.user.email?.split('@')[0]);
                    setUserInitial((profileData.full_name || 'A').charAt(0).toUpperCase());
                    setAvatarUrl(profileData.avatar_url);
                }
                setProfileLoading(false);

                // 3. Fetch QUESTIONS
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
    }, [classId, subjectId, questionType, navigate]);

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
        setIsModalOpen(true);
    };

    const handleOpenAdd = () => {
        setForm({
            question_text: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            correct_answer: ''
        });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
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
                setIsModalOpen(false);
            } else {
                const { data, error } = await supabase.from('questions').insert(payload).select().single();
                if (error) throw error;
                if (data) setQuestions(prev => [...prev, data]);
                setIsModalOpen(false);
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
        } catch (err) {
            alert("Delete failed: " + err.message);
        }
    };

    const handleExit = () => {
        if (window.opener || window.history.length === 1) {
            window.close();
        } else {
            navigate('/portal/admin/questions');
        }
    };

    return (
        <div className="qe-wrapper">
            <AdminHeader
                profileLoading={profileLoading}
                userName={userName}
                userInitial={userInitial}
                avatarUrl={avatarUrl}
                activeSession={activeSession}
                activeTerm={activeTerm}
            />
            <div className="qe-container">
                <div className="qe-content-card">
                    <header className="qe-header">
                        <div>
                            <h1 className="qe-title">{questionType} Questions ({className} - {subjectName})</h1>
                        </div>

                        <div className="qe-header-actions">
                            <button className="qe-settings-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </button>
                            <button className="qe-add-new-btn" onClick={handleOpenAdd}>
                                Add New
                            </button>
                        </div>
                    </header>

                    <main className="qe-questions-list">
                        {loading ? (
                            <div className="qe-empty">
                                <div className="qe-spinner"></div>
                                <p>Fetching your questions...</p>
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="qe-empty">
                                <span className="qe-empty-icon">📝</span>
                                <p>No questions added yet. Click 'Add New' to begin.</p>
                            </div>
                        ) : (
                            questions.map((q, i) => (
                                <div key={q.id} className="qe-q-card">
                                    <div className="qe-q-header">
                                        <h3 className="qe-q-text">{i + 1}. {q.question_text}</h3>
                                        <div className="qe-q-actions">
                                            <button className="qe-action-btn edit" onClick={() => handleEdit(q)} title="Edit Question">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button className="qe-action-btn delete" onClick={(e) => handleDelete(e, q.id)} title="Delete Question">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="qe-options-container">
                                        {['A', 'B', 'C', 'D'].map(opt => (
                                            <div key={opt} className={`qe-option ${q.correct_answer === opt ? 'is-correct' : ''}`}>
                                                <div className="qe-radio"></div>
                                                <span className="qe-option-text">{opt === 'A' ? q.option_a : opt === 'B' ? q.option_b : opt === 'C' ? q.option_c : q.option_d}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </main>
                </div>

                {/* Modal for Adding/Editing */}
                {isModalOpen && (
                    <div className="qe-modal-overlay">
                        <div className="qe-modal">
                            <div className="qe-modal-header">
                                <h2 className="qe-modal-title">{editingId ? 'Edit Question' : 'Add New Question'}</h2>
                            </div>
                            <form className="qe-form" onSubmit={handleSave}>
                                <div className="qe-form-group">
                                    <label className="qe-label">Question Text</label>
                                    <textarea
                                        className="qe-textarea"
                                        rows="3"
                                        required
                                        placeholder="Type your question here..."
                                        value={form.question_text}
                                        onChange={e => setForm({ ...form, question_text: e.target.value })}
                                    />
                                </div>

                                <div className="qe-options-grid">
                                    {['A', 'B', 'C', 'D'].map(opt => (
                                        <div key={opt} className="qe-form-group">
                                            <label className="qe-label">Option {opt}</label>
                                            <input
                                                type="text"
                                                className="qe-input"
                                                required
                                                value={form[`option_${opt.toLowerCase()}`]}
                                                onChange={e => setForm({ ...form, [`option_${opt.toLowerCase()}`]: e.target.value })}
                                                placeholder={`Option ${opt}...`}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="qe-form-group">
                                    <label className="qe-label">Correct Answer</label>
                                    <div className="qe-correct-select">
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

                                <div className="qe-modal-footer">
                                    <button type="button" className="qe-btn-cancel" onClick={handleCloseModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="qe-btn-save" disabled={saving}>
                                        {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminQuestionEditor;
