import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { CheckCircle } from 'lucide-react';
import './AdminResults.css';

const AdminResults = () => {
    // OMNI-FILL: Accessing global state for instant data
    const { 
        classes, 
        activeSession, 
        activeTerm, 
        subjectsCache, 
        resultsSummaryCache,
        setResultsSummaryCache 
    } = useOutletContext();

    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // 1. Initial Selection: Auto-select first class if none selected
    useEffect(() => {
        if (!selectedClassId && classes && classes.length > 0) {
            setSelectedClassId(classes[0].id);
        }
    }, [classes, selectedClassId]);

    // 2. Fetch/Load Results Summary (Stability First)
    useEffect(() => {
        const loadPageData = async () => {
            // Need a valid class and subjects for that class to proceed
            const currentSubjects = subjectsCache?.[selectedClassId] || [];
            if (!selectedClassId || currentSubjects.length === 0) return;

            // Only show loader if we don't have cached data for this specific class
            const isSilent = !!resultsSummaryCache?.[selectedClassId];
            if (!isSilent) setLoading(true);

            try {
                const sessionKey = (activeSession || '').trim();
                const termKey = (activeTerm || '').trim();

                // Fetch all result counts for this class/session/term in one go
                const { data: resultsData, error } = await supabase.from('exam_results')
                    .select('id, subject_id, question_type')
                    .eq('class_id', selectedClassId)
                    .eq('session_id', sessionKey)
                    .eq('term_id', termKey);

                if (error) throw error;

                // Map results to the subjects structure
                const summary = currentSubjects.map(sub => {
                    const subResults = resultsData?.filter(r => r.subject_id === sub.id) || [];
                    return {
                        id: sub.id,
                        name: sub.subject_name,
                        testCount: subResults.filter(r => r.question_type === 'test').length,
                        examCount: subResults.filter(r => r.question_type === 'exam').length,
                        candidateCount: subResults.filter(r => r.question_type === 'candidate').length
                    };
                });

                // Update global sync cache
                setResultsSummaryCache(prev => ({ ...prev, [selectedClassId]: summary }));
            } catch (err) {
                console.error("Result Registry Sync Error:", err);
            } finally {
                setLoading(false);
            }
        };

        // Trigger load whenever class, session, or basic subject cache changes
        if (activeSession && activeTerm) {
            loadPageData();
        }
    }, [selectedClassId, subjectsCache, activeSession, activeTerm, setResultsSummaryCache]);

    const handleViewDetails = (subject, type) => {
        const className = classes.find(c => c.id === selectedClassId)?.class_name || 'Class';
        navigate(`/portal/admin/results/detail?classId=${selectedClassId}&subjectId=${subject.id}&className=${encodeURIComponent(className)}&subjectName=${encodeURIComponent(subject.name)}&type=${type}`);
    };

    // 3. Logic: Determine what to display
    const currentSummary = resultsSummaryCache?.[selectedClassId] || [];
    const displayedSummary = selectedSubjectId 
        ? currentSummary.filter(s => s.id === selectedSubjectId)
        : currentSummary;

    // 4. Subjects for the specific class dropdown
    const classSubjects = subjectsCache?.[selectedClassId] || [];

    return (
        <div className="ar-main-wrap">
            <div className="ar-content-card">
                <header className="ar-header">
                    <div className="ar-title-area">
                        <h1>Result Registry</h1>
                        <p>Real-time overview of academic performance across all assessments.</p>
                    </div>

                    <div className="ar-filters">
                        <div className="ar-select-wrapper">
                            <select
                                className="ar-select"
                                value={selectedClassId}
                                onChange={e => {
                                    setSelectedClassId(e.target.value);
                                    setSelectedSubjectId(''); // Reset subject when class changes
                                }}
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
                                <option value="">Show All Subjects</option>
                                {classSubjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
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
                    {/* VISIBILITY GUARD: Case 1 - No Class Selected */}
                    {!selectedClassId ? (
                        <div className="ar-empty-placeholder">
                            <p>Please select a class to view academic records</p>
                        </div>
                    ) : 
                    /* VISIBILITY GUARD: Case 2 - Loading first time (no cache) */
                    loading && currentSummary.length === 0 ? (
                        <div className="ar-empty-state">
                            <div className="aq-spinner-mini"></div>
                            <p className="ar-empty-text">Connecting to database...</p>
                        </div>
                    ) : 
                    /* VISIBILITY GUARD: Case 3 - No subjects found for class */
                    classSubjects.length === 0 ? (
                        <div className="ar-empty-placeholder">
                            <p>No subjects found for this class in the curriculum.</p>
                        </div>
                    ) : (
                        <div className="ar-results-list">
                            {displayedSummary.map(sub => (
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
