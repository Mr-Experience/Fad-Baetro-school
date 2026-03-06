import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './AdminQuestions.css';

const AdminQuestions = () => {
    const navigate = useNavigate();
    const { classes, activeSession, activeTerm } = useOutletContext();

    const [subjects, setSubjects] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [loading, setLoading] = useState(false);

    // Question summary state
    const [questionSummary, setQuestionSummary] = useState([]);

    // Fetch Subjects
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!selectedClassId) {
                setSubjects([]);
                setSelectedSubjectId('');
                setQuestionSummary([]);
                return;
            }
            const { data } = await supabase
                .from('subjects')
                .select('id, subject_name')
                .eq('class_id', selectedClassId)
                .order('subject_name');
            if (data) setSubjects(data);
        };
        fetchSubjects();
    }, [selectedClassId]);

    // Fetch Question Summary
    useEffect(() => {
        const fetchSummary = async () => {
            if (!selectedClassId || subjects.length === 0) return;
            setLoading(true);
            try {
                // 2. Fetch counts per category (Filtered by Session/Term)
                const { data: qData } = await supabase
                    .from('questions')
                    .select('subject_id, question_type')
                    .eq('class_id', selectedClassId)
                    .eq('session_id', activeSession)
                    .eq('term_id', activeTerm);

                // 3. Fetch activation status
                const { data: cData } = await supabase
                    .from('exam_configs')
                    .select('subject_id, question_type, is_active')
                    .eq('class_id', selectedClassId)
                    .eq('session_id', activeSession)
                    .eq('term_id', activeTerm);

                const relevantSubjects = selectedSubjectId
                    ? subjects.filter(s => s.id === selectedSubjectId)
                    : subjects;

                const summary = relevantSubjects.map(sub => {
                    const subQs = qData?.filter(q => q.subject_id === sub.id) || [];
                    const subCfgs = cData?.filter(c => c.subject_id === sub.id) || [];

                    return {
                        id: sub.id,
                        name: sub.subject_name,
                        test: {
                            count: subQs.filter(q => q.question_type === 'test').length,
                            isLive: subCfgs.find(c => c.question_type === 'test')?.is_active || false
                        },
                        exam: {
                            count: subQs.filter(q => q.question_type === 'exam').length,
                            isLive: subCfgs.find(c => c.question_type === 'exam')?.is_active || false
                        },
                        candidate: {
                            count: subQs.filter(q => q.question_type === 'candidate').length,
                            isLive: subCfgs.find(c => c.question_type === 'candidate')?.is_active || false
                        }
                    };
                });
                setQuestionSummary(summary);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, [selectedClassId, selectedSubjectId, subjects]);

    const handleOpenEditor = (subject, type) => {
        const className = classes.find(c => c.id === selectedClassId)?.class_name || 'Class';
        const url = `/portal/admin/questions/editor?classId=${selectedClassId}&subjectId=${subject.id}&className=${encodeURIComponent(className)}&subjectName=${encodeURIComponent(subject.name || subject.subject_name)}&type=${type}`;
        window.open(url, '_blank');
    };

    return (
        <div className="aq-main-wrap">
            <div className="aq-content-card">
                <header className="aq-header">
                    <div className="aq-title-area">
                        <h1>Questions</h1>
                        <p>Select a class and subject to manage questions.</p>
                    </div>

                    <div className="aq-filters">
                        <div className="aq-select-wrapper">
                            <select
                                className="aq-select"
                                value={selectedClassId}
                                onChange={e => setSelectedClassId(e.target.value)}
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                            </select>
                            <div className="aq-select-icon">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>

                        <div className="aq-select-wrapper">
                            <select
                                className="aq-select"
                                value={selectedSubjectId}
                                onChange={e => setSelectedSubjectId(e.target.value)}
                                disabled={!selectedClassId}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
                            </select>
                            <div className="aq-select-icon">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="aq-main-content">
                    {!selectedClassId ? (
                        <div className="aq-empty-placeholder">
                            <p>Select class and subject to preview</p>
                        </div>
                    ) : (
                        <div className="aq-questions-list">
                            {questionSummary.map(sub => (
                                <div key={sub.id} className="aq-subject-row">
                                    <h2 className="aq-subject-name">{sub.name}</h2>
                                    <div className="aq-box-group">
                                        <div className="aq-box test" onClick={() => handleOpenEditor(sub, 'test')}>
                                            <span className="aq-box-label">Test</span>
                                            <span className="aq-box-count">{sub.test.count}</span>
                                            {sub.test.isLive && <div className="aq-live-indicator" title="Live"></div>}
                                        </div>
                                        <div className="aq-box exam" onClick={() => handleOpenEditor(sub, 'exam')}>
                                            <span className="aq-box-label">Exam</span>
                                            <span className="aq-box-count">{sub.exam.count}</span>
                                            {sub.exam.isLive && <div className="aq-live-indicator" title="Live"></div>}
                                        </div>
                                        <div className="aq-box candidate" onClick={() => handleOpenEditor(sub, 'candidate')}>
                                            <span className="aq-box-label">Candidate</span>
                                            <span className="aq-box-count">{sub.candidate.count}</span>
                                            {sub.candidate.isLive && <div className="aq-live-indicator" title="Live"></div>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminQuestions;
