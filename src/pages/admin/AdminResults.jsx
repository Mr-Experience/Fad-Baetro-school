import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { CheckCircle } from 'lucide-react';
import './AdminResults.css';

const AdminResults = () => {
    const { classes, activeSession, activeTerm, subjectsCache, setSubjectsCache } = useOutletContext();
    const [selectedClassId, setSelectedClassId] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Results summary state
    const [resultsSummary, setResultsSummary] = useState([]);

    // Combined Fetch for Subjects and Summary (Optimization)
    useEffect(() => {
        const loadPageData = async () => {
            if (!selectedClassId) {
                setSubjects([]);
                setResultsSummary([]);
                return;
            }

            setLoading(true);
            try {
                // 1. Fetch Subjects and Results in Parallel
                const [subjectsRes, resultsRes] = await Promise.all([
                    subjectsCache[selectedClassId] 
                        ? Promise.resolve({ data: subjectsCache[selectedClassId] }) 
                        : supabase.from('subjects').select('id, subject_name').eq('class_id', selectedClassId).order('subject_name'),
                    supabase.from('exam_results')
                        .select('id, subject_id, question_type')
                        .eq('class_id', selectedClassId)
                        .eq('session_id', (activeSession || '').trim())
                        .eq('term_id', (activeTerm || '').trim())
                        .is('subject_id', selectedSubjectId || null) // Optional filter if specific subject selected
                ]);

                // Update subjects and cache
                const fetchedSubjects = subjectsRes.data || [];
                setSubjects(fetchedSubjects);
                if (!subjectsCache[selectedClassId] && fetchedSubjects.length > 0) {
                    setSubjectsCache(prev => ({ ...prev, [selectedClassId]: fetchedSubjects }));
                }

                // Process Summary
                const allResults = resultsRes.data || [];
                const relevantSubjects = selectedSubjectId
                    ? fetchedSubjects.filter(s => s.id === selectedSubjectId)
                    : fetchedSubjects;

                const summary = relevantSubjects.map(sub => {
                    const subResults = allResults.filter(r => r.subject_id === sub.id);
                    return {
                        id: sub.id,
                        name: sub.subject_name,
                        testCount: subResults.filter(r => r.question_type === 'test').length,
                        examCount: subResults.filter(r => r.question_type === 'exam').length,
                        candidateCount: subResults.filter(r => r.question_type === 'candidate').length
                    };
                });

                setResultsSummary(summary);
            } catch (err) {
                console.error("Result fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (activeSession !== null && activeTerm !== null) {
            loadPageData();
        }
    }, [selectedClassId, selectedSubjectId, activeSession, activeTerm]);

    const handleViewDetails = (subject, type) => {
        navigate(`/portal/admin/results/detail?classId=${selectedClassId}&subjectId=${subject.id}&className=${classes.find(c => c.id === selectedClassId)?.class_name}&subjectName=${subject.name}&type=${type}`);
    };

    return (
        <div className="ar-main-wrap">
            <div className="ar-content-card">
                <header className="ar-header">
                    <div className="ar-title-area">
                        <h1>Result</h1>
                        <p>Select a class and subject to see result for that combination.</p>
                    </div>

                    <div className="ar-filters">
                        <div className="ar-select-wrapper">
                            <select
                                className="ar-select"
                                value={selectedClassId}
                                onChange={e => setSelectedClassId(e.target.value)}
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                            </select>
                            <div className="ar-select-icon">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>

                        <div className="ar-select-wrapper">
                            <select
                                className="ar-select"
                                value={selectedSubjectId}
                                onChange={e => setSelectedSubjectId(e.target.value)}
                                disabled={!selectedClassId}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
                            </select>
                            <div className="ar-select-icon">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="ar-main-content">
                    {!selectedClassId ? (
                        <div className="ar-empty-state">
                            <h2 className="ar-empty-text">Select Class and Subject to view Result</h2>
                        </div>
                    ) : (
                        <div className="ar-results-list">
                            {resultsSummary.map(sub => (
                                <div key={sub.id} className="ar-subject-row">
                                    <h2 className="ar-subject-name">{sub.name}</h2>
                                    <div className="ar-box-group">
                                        <div className={`aq-box test ${sub.testCount > 0 ? 'has-results' : ''}`} onClick={() => handleViewDetails(sub, 'test')}>
                                            <span className="aq-box-label">Test</span>
                                            <span className="aq-box-count">{sub.testCount}</span>
                                            {sub.testCount > 0 && <span className="aq-saved-badge"><CheckCircle size={10} /> Saved</span>}
                                        </div>
                                        <div className={`aq-box exam ${sub.examCount > 0 ? 'has-results' : ''}`} onClick={() => handleViewDetails(sub, 'exam')}>
                                            <span className="aq-box-label">Exam</span>
                                            <span className="aq-box-count">{sub.examCount}</span>
                                            {sub.examCount > 0 && <span className="aq-saved-badge"><CheckCircle size={10} /> Saved</span>}
                                        </div>
                                        <div className={`aq-box candidate ${sub.candidateCount > 0 ? 'has-results' : ''}`} onClick={() => handleViewDetails(sub, 'candidate')}>
                                            <span className="aq-box-label">Candidate</span>
                                            <span className="aq-box-count">{sub.candidateCount}</span>
                                            {sub.candidateCount > 0 && <span className="aq-saved-badge"><CheckCircle size={10} /> Saved</span>}
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

export default AdminResults;
