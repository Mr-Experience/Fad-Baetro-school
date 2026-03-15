import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
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

    const { 
        activeSession: globalSession, 
        activeTerm: globalTerm, 
        profileLoading: globalProfileLoading,
        userId: globalUserId,
        userName: globalUserName,
        userInitial: globalUserInitial,
        avatarUrl: globalAvatarUrl 
    } = useOutletContext();

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [configSaving, setConfigSaving] = useState(false);

    const [configForm, setConfigForm] = useState({
        is_active: false,
        visible_at: '',
        duration_minutes: 60,
        question_count: 0,
        selection_type: 'random'
    });

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
            if (!globalSession || !globalTerm) return;
            setLoading(true);
            try {
                // 1. Fetch QUESTIONS
                if (classId && subjectId) {
                    const { data } = await supabase
                        .from('questions')
                        .select('*')
                        .eq('class_id', classId)
                        .eq('subject_id', subjectId)
                        .eq('question_type', questionType)
                        .eq('session_id', globalSession.trim())
                        .eq('term_id', globalTerm.trim())
                        .order('created_at', { ascending: true });
                    if (data) setQuestions(data);

                    // 2. Fetch EXAM CONFIG
                    const { data: config } = await supabase
                        .from('exam_configs')
                        .select('*')
                        .eq('class_id', classId)
                        .eq('subject_id', subjectId)
                        .eq('question_type', questionType)
                        .eq('session_id', globalSession.trim())
                        .eq('term_id', globalTerm.trim())
                        .maybeSingle();

                    if (config) {
                        const { data: aeRecord } = await supabase
                            .from('active_exams')
                            .select('*')
                            .eq('exam_config_id', config.id)
                            .maybeSingle();

                        const timeToUse = aeRecord?.visible_at || config.visible_at;
                        const localVisibleAt = timeToUse
                            ? new Date(new Date(timeToUse).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
                            : '';

                        setConfigForm({
                            is_active: aeRecord ? aeRecord.is_active : false,
                            visible_at: localVisibleAt,
                            duration_minutes: config.duration_minutes || 60,
                            question_count: config.question_count || 0,
                            selection_type: config.selection_type || 'random',
                            active_exam_id: aeRecord?.id || null
                        });
                    }
                }
            } catch (err) {
                console.error("Initiation error:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [classId, subjectId, questionType, globalSession, globalTerm]);

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
                session_id: globalSession.trim(),
                term_id: globalTerm.trim(),
                question_type: questionType,
                question_text: form.question_text,
                option_a: form.option_a,
                option_b: form.option_b,
                option_c: form.option_c,
                option_d: form.option_d,
                options: { a: form.option_a, b: form.option_b, c: form.option_c, d: form.option_d },
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

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setConfigSaving(true);
        try {
            const payload = {
                class_id: classId,
                subject_id: subjectId,
                question_type: questionType,
                session_id: globalSession.trim(),
                term_id: globalTerm.trim(),
                is_active: configForm.is_active,
                visible_at: configForm.visible_at ? new Date(configForm.visible_at).toISOString() : new Date().toISOString(),
                duration_minutes: parseInt(configForm.duration_minutes),
                question_count: parseInt(configForm.question_count),
                selection_type: configForm.selection_type,
                updated_at: new Date().toISOString()
            };

            // We try to upsert specifically with session/term if available
            // If the DB constraint is broader, this might fail, so we catch and retry if needed
            const { data: cfgData, error: cfgError } = await supabase
                .from('exam_configs')
                .upsert(payload, {
                    onConflict: 'class_id,subject_id,question_type,session_id,term_id'
                })
                .select()
                .single();

            let finalCfgData = cfgData;
            if (cfgError) {
                if (cfgError.message.includes('unique constraint') || cfgError.code === '42P10') {
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('exam_configs')
                        .upsert(payload, { onConflict: 'class_id,subject_id,question_type' })
                        .select()
                        .single();
                    if (fallbackError) throw fallbackError;
                    finalCfgData = fallbackData;
                } else {
                    throw cfgError;
                }
            }

            // 2. Manage ACTIVE_EXAMS Record
            if (configForm.is_active) {
                const aePayload = {
                    exam_config_id: finalCfgData.id,
                    visible_at: payload.visible_at,
                    is_active: true,
                    session_id: globalSession.trim(),
                    term_id: globalTerm.trim(),
                    updated_at: new Date().toISOString()
                };
                const { error: aeError } = await supabase
                    .from('active_exams')
                    .upsert(aePayload, { onConflict: 'exam_config_id' });
                if (aeError) throw aeError;
            } else {
                // If toggled off, we deactivate the active_exams record or delete it
                await supabase
                    .from('active_exams')
                    .delete()
                    .eq('exam_config_id', finalCfgData.id);
            }
            setIsConfigModalOpen(false);
            alert("Settings updated successfully!");
        } catch (err) {
            alert("Error saving settings: " + err.message);
        } finally {
            setConfigSaving(false);
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
            <div className="qe-container">
                <div className="qe-content-card">
                    <header className="qe-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button className="qe-back-btn" onClick={handleExit} title="Go Back">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>
                            <h1 className="qe-title">{questionType.toUpperCase()} Questions ({subjectName})</h1>
                        </div>

                        <div className="qe-header-actions">
                            <button className="qe-settings-btn" onClick={() => setIsConfigModalOpen(true)} title="Exam Configuration">
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
                                            <div key={opt} className={`qe-option ${(q.correct_answer || '').toString().trim().toUpperCase() === opt.toUpperCase() ? 'is-correct' : ''}`}>
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

                {/* Config Modal */}
                {isConfigModalOpen && (
                    <div className="qe-modal-overlay" onClick={() => setIsConfigModalOpen(false)}>
                        <div className="qe-modal config" onClick={e => e.stopPropagation()}>
                            <div className="qe-modal-header">
                                <h2 className="qe-modal-title">Exam Settings - {subjectName}</h2>
                                <p className="qe-modal-subtitle">Configure access controls for this {questionType}.</p>
                            </div>
                            <form className="qe-form" onSubmit={handleSaveConfig}>
                                <div className="qe-config-grid">
                                    <div className="qe-form-group">
                                        <label className="qe-label">Active (Live Status)</label>
                                        <div className="qe-toggle-wrap" onClick={() => setConfigForm({ ...configForm, is_active: !configForm.is_active })}>
                                            <div className={`qe-toggle-track ${configForm.is_active ? 'active' : ''}`}>
                                                <div className="qe-toggle-thumb"></div>
                                            </div>
                                            <span className="qe-toggle-label">{configForm.is_active ? 'LIVE & ACCESSIBLE' : 'NOT LIVE'}</span>
                                        </div>
                                    </div>

                                    <div className="qe-form-group">
                                        <label className="qe-label">When will it go live?</label>
                                        <input
                                            type="datetime-local"
                                            className="qe-input"
                                            value={configForm.visible_at}
                                            onChange={e => setConfigForm({ ...configForm, visible_at: e.target.value })}
                                        />
                                    </div>

                                    <div className="qe-form-group">
                                        <label className="qe-label">Duration (Minutes)</label>
                                        <input
                                            type="number"
                                            className="qe-input"
                                            min="1"
                                            required
                                            value={configForm.duration_minutes}
                                            onChange={e => setConfigForm({ ...configForm, duration_minutes: e.target.value })}
                                        />
                                    </div>

                                    <div className="qe-form-group">
                                        <label className="qe-label">Questions to show (0 = All)</label>
                                        <input
                                            type="number"
                                            className="qe-input"
                                            min="0"
                                            required
                                            value={configForm.question_count}
                                            onChange={e => setConfigForm({ ...configForm, question_count: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="qe-modal-footer">
                                    <button type="button" className="qe-btn-cancel" onClick={() => setIsConfigModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="qe-btn-save" disabled={configSaving}>
                                        {configSaving ? 'Updating...' : 'Apply Config'}
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
