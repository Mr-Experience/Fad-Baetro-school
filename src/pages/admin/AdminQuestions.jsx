import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './AdminQuestions.css';

const AdminQuestions = () => {
    const navigate = useNavigate();
    const { 
        classes, 
        activeSession, 
        activeTerm, 
        subjectsCache, 
        setSubjectsCache,
        questionSummaryCache,
        setQuestionSummaryCache 
    } = useOutletContext();

    const [subjects, setSubjects] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [loading, setLoading] = useState(false);

    // Initial class selection
    useEffect(() => {
        if (!selectedClassId && classes && classes.length > 0) {
            setSelectedClassId(classes[0].id);
        }
    }, [classes, selectedClassId]);

    // Fetch Subjects (using cache from Layout)
    useEffect(() => {
        if (selectedClassId && subjectsCache) {
            setSubjects(subjectsCache[selectedClassId] || []);
        } else {
            setSubjects([]);
        }
    }, [selectedClassId, subjectsCache]);

    // Fetch Question Summary (Synchronized & Stable)
    useEffect(() => {
        const fetchSummary = async () => {
            if (!selectedClassId || subjects.length === 0) return;
            
            // Check if we already have this in the global summary cache (Omni-Fill)
            const isSilent = !!questionSummaryCache?.[selectedClassId];
            if (!isSilent) setLoading(true);

            try {
                const sessionKey = (activeSession || '').trim();
                const termKey = (activeTerm || '').trim();

                const [qData, cData] = await Promise.all([
                    supabase.from('questions')
                        .select('subject_id, question_type')
                        .eq('class_id', selectedClassId)
                        .eq('session_id', sessionKey)
                        .eq('term_id', termKey),
                    supabase.from('exam_configs')
                        .select('subject_id, question_type, is_active')
                        .eq('class_id', selectedClassId)
                        .eq('session_id', sessionKey)
                        .eq('term_id', termKey)
                ]);

                const summary = subjects.map(sub => {
                    const subQs = qData.data?.filter(q => q.subject_id === sub.id) || [];
                    const subCfgs = cData.data?.filter(c => c.subject_id === sub.id) || [];

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
                
                // Update global sync cache
                setQuestionSummaryCache(prev => ({ ...prev, [selectedClassId]: summary }));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, [selectedClassId, selectedSubjectId, subjects, activeSession, activeTerm, setQuestionSummaryCache]);

    const handleOpenEditor = (subject, type) => {
        const className = classes.find(c => c.id === selectedClassId)?.class_name || 'Class';
        const url = `/portal/admin/questions/editor?classId=${selectedClassId}&subjectId=${subject.id}&className=${encodeURIComponent(className)}&subjectName=${encodeURIComponent(subject.name || subject.subject_name)}&type=${type}`;
        navigate(url);
    };

    const currentSummary = questionSummaryCache?.[selectedClassId] || [];
    // If a specific subject is selected, filter the displayed summary
    const displayedSummary = selectedSubjectId 
        ? currentSummary.filter(s => s.id === selectedSubjectId)
        : currentSummary;

    return (
        <div className="aq-main-wrap">
            <div className="aq-content-card">
                <header className="aq-header">
                    <div className="aq-title-area">
                        <h1>Questions Registry</h1>
                        <p>Manage examinations, tests, and admission assessments.</p>
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
                                <option value="">Draft (All Subjects)</option>
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
                    {loading && displayedSummary.length === 0 ? (
                        <div className="aq-empty-placeholder">
                            <div className="aq-spinner-mini"></div>
                            <p>Loading questions...</p>
                        </div>
                    ) : !selectedClassId ? (
                        <div className="aq-empty-placeholder">
                            <p>Please select a class to view records</p>
                        </div>
                    ) : (
                        <div className="aq-questions-list">
                            {displayedSummary.map(sub => (
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
