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
            if (!selectedClassId) return;

            // Optional Loader: Only show if we don't have ANY cache for this class
            const isSilent = !!resultsSummaryCache?.[selectedClassId];
            if (!isSilent) setLoading(true);

            try {
                // Normalize Session/Term keys to prevent invisible data due to case/whitespace
                const sessionKey = (activeSession || '').trim().toLowerCase();
                const termKey = (activeTerm || '').trim().toLowerCase();

                // Fetch all result counts for this class
                const { data: rawData, error } = await supabase.from('exam_results')
                    .select('id, subject_id, question_type, subject_name, session_id, term_id')
                    .eq('class_id', selectedClassId);

                if (error) throw error;

                // ROBUST FILTERING: Case-insensitive & Trimmed matching
                const resultsData = rawData?.filter(r => {
                    const rowSession = (r.session_id || '').trim().toLowerCase();
                    const rowTerm = (r.term_id || '').trim().toLowerCase();
                    return rowSession === sessionKey && rowTerm === termKey;
                }) || [];

                // subjectsCache is { classId: [subjects] }
                const currentSubjects = subjectsCache?.[selectedClassId] || [];
                
                // Map results to the subjects structure
                // Logic: If subjects are missing for this class, we synthesize a list from the results themselves
                // so the admin can always see that people TOOK the exam even if curriculum is missing.
                let mappedSummary = [];

                if (currentSubjects.length > 0) {
                    mappedSummary = currentSubjects.map(sub => {
                        const subResults = resultsData?.filter(r => r.subject_id === sub.id) || [];
                        return {
                            id: sub.id,
                            name: sub.subject_name,
                            testCount: subResults.filter(r => r.question_type === 'test').length,
                            examCount: subResults.filter(r => r.question_type === 'exam').length,
                            candidateCount: subResults.filter(r => r.question_type === 'candidate').length
                        };
                    });

                    // Add any results that DON'T match a known subject (orphaned results)
                    const knownIds = new Set(currentSubjects.map(s => s.id));
                    const orphaned = resultsData?.filter(r => !knownIds.has(r.subject_id)) || [];
                    
                    if (orphaned.length > 0) {
                        const orphanedGroups = {};
                        orphaned.forEach(r => {
                            const key = r.subject_id || 'unknown';
                            if (!orphanedGroups[key]) orphanedGroups[key] = { id: key, name: r.subject_name || 'Generic Result', testCount: 0, examCount: 0, candidateCount: 0 };
                            if (r.question_type === 'test') orphanedGroups[key].testCount++;
                            else if (r.question_type === 'exam') orphanedGroups[key].examCount++;
                            else if (r.question_type === 'candidate') orphanedGroups[key].candidateCount++;
                        });
                        mappedSummary = [...mappedSummary, ...Object.values(orphanedGroups)];
                    }
                } else {
                    // No subjects in cache for this class? Synthesize from results so admin sees something!
                    const groups = {};
                    resultsData?.forEach(r => {
                        const key = r.subject_id || 'unknown';
                        if (!groups[key]) groups[key] = { id: key, name: r.subject_name || 'Generic Result', testCount: 0, examCount: 0, candidateCount: 0 };
                        if (r.question_type === 'test') groups[key].testCount++;
                        else if (r.question_type === 'exam') groups[key].examCount++;
                        else if (r.question_type === 'candidate') groups[key].candidateCount++;
                    });
                    mappedSummary = Object.values(groups);
                }

                // Update global sync cache
                setResultsSummaryCache(prev => ({ ...prev, [selectedClassId]: mappedSummary }));
            } catch (err) {
                console.error("Result Registry Sync Error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (activeSession !== null && activeTerm !== null) {
            loadPageData();
        }
    }, [selectedClassId, subjectsCache, activeSession, activeTerm, setResultsSummaryCache]);

    const handleViewDetails = (subject, type) => {
        const className = classes.find(c => c.id === selectedClassId)?.class_name || 'Class';
        navigate(`/portal/admin/results/detail?classId=${selectedClassId}&subjectId=${subject.id}&className=${encodeURIComponent(className)}&subjectName=${encodeURIComponent(subject.name)}&type=${type}`);
    };

    // 3. Logic: Determine what to display (INSTANT SELECTORS)
    const displayedSummary = React.useMemo(() => {
        const currentSummary = resultsSummaryCache?.[selectedClassId] || [];
        if (!selectedSubjectId) return currentSummary;
        return currentSummary.filter(s => s.id === selectedSubjectId);
    }, [selectedClassId, selectedSubjectId, resultsSummaryCache]);

    const classSubjects = React.useMemo(() => {
        return subjectsCache?.[selectedClassId] || [];
    }, [selectedClassId, subjectsCache]);

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
                    {/* VISIBILITY GUARD: Only show loading if we have absolutely NO data (first load) */}
                    {!selectedClassId ? (
                        <div className="ar-empty-placeholder">
                            <p>Please select a class to view records</p>
                        </div>
                    ) : (loading && displayedSummary.length === 0) ? (
                        <div className="ar-empty-placeholder">
                            <div className="aq-spinner-mini"></div>
                            <p>Syncing academic records...</p>
                        </div>
                    ) : displayedSummary.length === 0 ? (
                        <div className="ar-empty-placeholder">
                            <p>{loading ? "Fetching records..." : selectedSubjectId ? "No results found for this subject." : "No academic records found for this class in the current session."}</p>
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
