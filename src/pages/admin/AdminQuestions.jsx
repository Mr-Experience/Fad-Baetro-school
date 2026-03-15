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

    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [loading, setLoading] = useState(false);

    // Initial class selection
    useEffect(() => {
        if (!selectedClassId && classes?.length > 0) {
            setSelectedClassId(classes[0].id);
        }
    }, [classes, selectedClassId]);

    // Subjects derived instantly from cache
    const subjects = React.useMemo(() => {
        if (selectedClassId && subjectsCache) {
            return subjectsCache[selectedClassId] || [];
        }
        return [];
    }, [selectedClassId, subjectsCache]);

    // Fetch Question Summary (Synchronized & Stable)
    useEffect(() => {
        const fetchSummary = async () => {
            if (!selectedClassId) return;
            
            // Check if we already have this in the global summary cache (Omni-Fill)
            const isSilent = !!questionSummaryCache?.[selectedClassId];
            if (!isSilent) setLoading(true);

            try {
                const sessionKey = (activeSession || '').trim();
                const termKey = (activeTerm || '').trim();

                const [qRes, cRes] = await Promise.all([
                    supabase.from('questions')
                        .select('subject_id, question_type, session_id, term_id, subjects(subject_name)')
                        .eq('class_id', selectedClassId),
                    supabase.from('exam_configs')
                        .select('subject_id, question_type, is_active, session_id, term_id')
                        .eq('class_id', selectedClassId)
                ]);

                if (qRes.error) throw qRes.error;
                if (cRes.error) throw cRes.error;

                // ROBUST FILTERING: Client-side filtering for whitespace resilience
                const qData = qRes.data?.filter(q => (q.session_id || '').trim() === sessionKey && (q.term_id || '').trim() === termKey) || [];
                const cData = cRes.data?.filter(c => (c.session_id || '').trim() === sessionKey && (c.term_id || '').trim() === termKey) || [];

                let summary = subjects.map(sub => {
                    const subQs = qData.filter(q => q.subject_id === sub.id);
                    const subCfgs = cData.filter(c => c.subject_id === sub.id);

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

                // ORPHANED QUESTIONS: Handle questions that don't match any subject in the curriculum
                const knownSubjectIds = new Set(subjects.map(s => s.id));
                const orphanedQs = qData.filter(q => !knownSubjectIds.has(q.subject_id));
                
                if (orphanedQs.length > 0) {
                    const orphanedGrouped = {};
                    orphanedQs.forEach(q => {
                        const sId = q.subject_id || 'unknown';
                        const sName = q.subjects?.subject_name || 'Legacy Category';
                        if (!orphanedGrouped[sId]) {
                            orphanedGrouped[sId] = { 
                                id: sId, 
                                name: sName,
                                test: { count: 0, isLive: false },
                                exam: { count: 0, isLive: false },
                                candidate: { count: 0, isLive: false }
                            };
                        }
                        const type = q.question_type || 'test';
                        if (orphanedGrouped[sId][type]) orphanedGrouped[sId][type].count++;
                        
                        // Check if live for this orphan
                        const cfg = cData.find(c => c.subject_id === q.subject_id && c.question_type === type);
                        if (cfg && cfg.is_active) orphanedGrouped[sId][type].isLive = true;
                    });
                    summary = [...summary, ...Object.values(orphanedGrouped)];
                }
                
                // Update global sync cache
                setQuestionSummaryCache(prev => ({ ...prev, [selectedClassId]: summary }));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, [selectedClassId, subjects, activeSession, activeTerm, setQuestionSummaryCache]);

    const handleOpenEditor = (subject, type) => {
        const className = classes.find(c => c.id === selectedClassId)?.class_name || 'Class';
        const url = `/portal/admin/questions/editor?classId=${selectedClassId}&subjectId=${subject.id}&className=${encodeURIComponent(className)}&subjectName=${encodeURIComponent(subject.name || subject.subject_name)}&type=${type}`;
        navigate(url);
    };

    // Results derived instantly from cache
    const displayedSummary = React.useMemo(() => {
        const currentSummary = questionSummaryCache?.[selectedClassId] || [];
        if (!selectedSubjectId) return currentSummary;
        return currentSummary.filter(s => s.id === selectedSubjectId);
    }, [selectedClassId, selectedSubjectId, questionSummaryCache]);

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
                    {!selectedClassId ? (
                        <div className="aq-empty-placeholder">
                            <p>Please select a class to view records</p>
                        </div>
                    ) : (loading && displayedSummary.length === 0) ? (
                        <div className="aq-empty-placeholder">
                            <div className="aq-spinner-mini"></div>
                            <p>Connecting to registry...</p>
                        </div>
                    ) : displayedSummary.length === 0 ? (
                        <div className="aq-empty-placeholder">
                            <p>{loading ? "Syncing curriculum..." : "No subjects found for this class."}</p>
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
