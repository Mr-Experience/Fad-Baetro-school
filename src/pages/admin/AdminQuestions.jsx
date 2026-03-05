import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './AdminQuestions.css';

const AdminQuestions = () => {
    const navigate = useNavigate();

    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [counts, setCounts] = useState({ total: 0, test: 0, exam: 0, candidate: 0 });
    const [activeStatus, setActiveStatus] = useState({ test: false, exam: false, candidate: false });
    const [allConfigs, setAllConfigs] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Load classes on mount
    useEffect(() => {
        const fetchClasses = async () => {
            const { data } = await supabase.from('classes').select('*').order('class_name');
            if (data) setClasses(data);
        };

        const fetchAllConfigs = async () => {
            // Join exam_configs with classes and subjects
            const { data, error } = await supabase
                .from('exam_configs')
                .select(`
                    id,
                    is_active,
                    question_type,
                    question_count,
                    classes (class_name),
                    subjects (subject_name, id),
                    class_id
                `)
                .order('updated_at', { ascending: false });

            if (data) setAllConfigs(data);
        };

        fetchClasses();
        fetchAllConfigs();
    }, []);

    // Load subjects when class changes
    useEffect(() => {
        setSelectedSubject('');
        setSubjects([]);
        setCounts({ total: 0, test: 0, exam: 0, candidate: 0 });
        setActiveStatus({ test: false, exam: false, candidate: false });

        if (!selectedClass) return;

        const fetchSubjects = async () => {
            const { data } = await supabase
                .from('subjects')
                .select('*')
                .eq('class_id', selectedClass)
                .order('subject_name');
            if (data) setSubjects(data);
        };
        fetchSubjects();
    }, [selectedClass]);

    // Count questions when both class + subject selected
    useEffect(() => {
        setCounts({ total: 0, test: 0, exam: 0, candidate: 0 });
        if (!selectedClass || !selectedSubject) return;

        const fetchCounts = async () => {
            setLoading(true);

            // 1. Fetch Question counts
            const { data: qData, error: qError } = await supabase
                .from('questions')
                .select('question_type')
                .eq('class_id', selectedClass)
                .eq('subject_id', selectedSubject);

            if (!qError && qData) {
                const c = { total: qData.length, test: 0, exam: 0, candidate: 0 };
                qData.forEach(q => {
                    const type = q.question_type || 'exam';
                    if (c[type] !== undefined) c[type]++;
                });
                setCounts(c);
            }

            // 2. Fetch Active Status from exam_configs
            const { data: cData } = await supabase
                .from('exam_configs')
                .select('question_type, is_active')
                .eq('class_id', selectedClass)
                .eq('subject_id', selectedSubject);

            if (cData) {
                const status = { test: false, exam: false, candidate: false };
                cData.forEach(cfg => {
                    if (status[cfg.question_type] !== undefined) {
                        status[cfg.question_type] = cfg.is_active;
                    }
                });
                setActiveStatus(status);
            }

            setLoading(false);
        };
        fetchCounts();
    }, [selectedClass, selectedSubject]);

    const toggleLiveStatus = async (e, config) => {
        e.stopPropagation(); // Don't select the card
        const newStatus = !config.is_active;

        try {
            // 1. If activating, enforce exclusivity (deactivate others for same class/type)
            if (newStatus) {
                await supabase
                    .from('exam_configs')
                    .update({ is_active: false })
                    .eq('class_id', config.class_id)
                    .eq('question_type', config.question_type);
            }

            // 2. Update this specific config
            const { error } = await supabase
                .from('exam_configs')
                .update({ is_active: newStatus })
                .eq('id', config.id);

            if (error) throw error;

            // 3. Update local state for instant feedback
            setAllConfigs(prev => prev.map(c => {
                // If we turned this one ON, others of same class/type in list should turn OFF
                if (newStatus && c.class_id === config.class_id && c.question_type === config.question_type) {
                    return { ...c, is_active: c.id === config.id };
                }
                // If we simply turned this one OFF
                if (c.id === config.id) return { ...c, is_active: newStatus };
                return c;
            }));

            // Also update the activeStatus state if this is the currently selected class/subject
            if (selectedClass === config.class_id && selectedSubject === config.subjects?.id) {
                setActiveStatus(prev => ({ ...prev, [config.question_type]: newStatus }));
            }

        } catch (err) {
            console.error("Failed to toggle status:", err);
            alert("Status update failed. Please try again.");
        }
    };

    const selectedClassName = classes.find(c => c.id === selectedClass)?.class_name || '';
    const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.subject_name || '';

    const handleExpand = () => {
        const url = `/portal/admin/questions/editor?classId=${selectedClass}&subjectId=${selectedSubject}&className=${encodeURIComponent(selectedClassName)}&subjectName=${encodeURIComponent(selectedSubjectName)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="aq-container">
            <div className="aq-card">
                <div className="aq-header">
                    <div className="aq-header-left">
                        <h1 className="aq-title">Questions</h1>
                        <p className="aq-subtitle">Select a class and subject to manage questions for that combination.</p>
                    </div>

                    <div className="aq-filters">
                        <div className="aq-filter-group">
                            <label className="aq-filter-label">Class</label>
                            <select
                                className="aq-select"
                                value={selectedClass}
                                onChange={e => setSelectedClass(e.target.value)}
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.class_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="aq-filter-group">
                            <label className="aq-filter-label">Subject</label>
                            <select
                                className="aq-select"
                                value={selectedSubject}
                                onChange={e => setSelectedSubject(e.target.value)}
                                disabled={!selectedClass}
                            >
                                <option value="">
                                    {selectedClass ? 'Select Subject' : '— Select class first —'}
                                </option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.subject_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Panel or Empty State */}
                {selectedClass && selectedSubject ? (
                    <div className="aq-panel">
                        <div className="aq-panel-header">
                            <div className="aq-panel-left">
                                <div className="aq-panel-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                                </div>
                                <div className="aq-panel-info">
                                    <h3>{selectedSubjectName}</h3>
                                    <div className="aq-breakdown">
                                        <div className={`aq-breakdown-item ${activeStatus.test ? 'active' : ''}`}>
                                            <span className="aq-break-dot test" />
                                            <span>Test: <strong>{counts.test}</strong></span>
                                            {activeStatus.test && <span className="aq-live-badge">LIVE</span>}
                                        </div>
                                        <div className={`aq-breakdown-item ${activeStatus.exam ? 'active' : ''}`}>
                                            <span className="aq-break-dot exam" />
                                            <span>Exam: <strong>{counts.exam}</strong></span>
                                            {activeStatus.exam && <span className="aq-live-badge">LIVE</span>}
                                        </div>
                                        <div className={`aq-breakdown-item ${activeStatus.candidate ? 'active' : ''}`}>
                                            <span className="aq-break-dot candidate" />
                                            <span>Candidate: <strong>{counts.candidate}</strong></span>
                                            {activeStatus.candidate && <span className="aq-live-badge">LIVE</span>}
                                        </div>
                                    </div>
                                    <span className="aq-panel-meta">
                                        {selectedClassName}
                                    </span>
                                </div>
                            </div>

                            <div className="aq-panel-right">
                                <div className="aq-count-badge">
                                    <div className="aq-count-number">{loading ? '…' : counts.total}</div>
                                    <div className="aq-count-label">Total Questions</div>
                                </div>
                            </div>
                        </div>

                        <div className="aq-portals-grid">
                            <div className="aq-portal-tile" onClick={() => window.location.href = `/portal/admin/questions/editor?classId=${selectedClass}&subjectId=${selectedSubject}&className=${encodeURIComponent(selectedClassName)}&subjectName=${encodeURIComponent(selectedSubjectName)}&type=test`}>
                                <div className="aq-tile-top">
                                    <div className="aq-tile-icon test">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                    </div>
                                    <span className={`aq-tile-status ${activeStatus.test ? 'active' : 'draft'}`}>
                                        {activeStatus.test ? 'Live' : 'Draft'}
                                    </span>
                                </div>
                                <div className="aq-tile-content">
                                    <h4>Test Portal</h4>
                                    <p>Standard class assessments and weekly tests.</p>
                                </div>
                                <div className="aq-tile-footer">
                                    <span className="aq-tile-qcount"><strong>{counts.test}</strong> Questions</span>
                                    <div className="aq-tile-actions">
                                        <button
                                            className="aq-mini-action"
                                            title="Quick Settings"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.href = `/portal/admin/questions/editor?classId=${selectedClass}&subjectId=${selectedSubject}&className=${encodeURIComponent(selectedClassName)}&subjectName=${encodeURIComponent(selectedSubjectName)}&type=test&openSettings=true`;
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                                        </button>
                                        <div className="aq-config-arrow">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="aq-portal-tile" onClick={() => window.location.href = `/portal/admin/questions/editor?classId=${selectedClass}&subjectId=${selectedSubject}&className=${encodeURIComponent(selectedClassName)}&subjectName=${encodeURIComponent(selectedSubjectName)}&type=exam`}>
                                <div className="aq-tile-top">
                                    <div className="aq-tile-icon exam">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                    </div>
                                    <span className={`aq-tile-status ${activeStatus.exam ? 'active' : 'draft'}`}>
                                        {activeStatus.exam ? 'Live' : 'Draft'}
                                    </span>
                                </div>
                                <div className="aq-tile-content">
                                    <h4>Examination Portal</h4>
                                    <p>Formal term exams and seasonal assessments.</p>
                                </div>
                                <div className="aq-tile-footer">
                                    <span className="aq-tile-qcount"><strong>{counts.exam}</strong> Questions</span>
                                    <div className="aq-tile-actions">
                                        <button
                                            className="aq-mini-action"
                                            title="Quick Settings"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.href = `/portal/admin/questions/editor?classId=${selectedClass}&subjectId=${selectedSubject}&className=${encodeURIComponent(selectedClassName)}&subjectName=${encodeURIComponent(selectedSubjectName)}&type=exam&openSettings=true`;
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                                        </button>
                                        <div className="aq-config-arrow">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="aq-portal-tile" onClick={() => window.location.href = `/portal/admin/questions/editor?classId=${selectedClass}&subjectId=${selectedSubject}&className=${encodeURIComponent(selectedClassName)}&subjectName=${encodeURIComponent(selectedSubjectName)}&type=candidate`}>
                                <div className="aq-tile-top">
                                    <div className="aq-tile-icon candidate">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
                                    </div>
                                    <span className={`aq-tile-status ${activeStatus.candidate ? 'active' : 'draft'}`}>
                                        {activeStatus.candidate ? 'Live' : 'Draft'}
                                    </span>
                                </div>
                                <div className="aq-tile-content">
                                    <h4>Candidate Portal</h4>
                                    <p>Manage external or entrance examination question sets.</p>
                                </div>
                                <div className="aq-tile-footer">
                                    <span className="aq-tile-qcount"><strong>{counts.candidate}</strong> Questions</span>
                                    <div className="aq-tile-actions">
                                        <button
                                            className="aq-mini-action"
                                            title="Quick Settings"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.href = `/portal/admin/questions/editor?classId=${selectedClass}&subjectId=${selectedSubject}&className=${encodeURIComponent(selectedClassName)}&subjectName=${encodeURIComponent(selectedSubjectName)}&type=candidate&openSettings=true`;
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                                        </button>
                                        <div className="aq-config-arrow">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="aq-dashboard">
                        {allConfigs.length === 0 ? (
                            <div className="aq-empty-prompt">
                                <div className="aq-empty-icon">
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                                </div>
                                <h3>No configurations found</h3>
                                <p>Select a class and subject above to start setting questions.</p>
                            </div>
                        ) : (
                            <div className="aq-grid">
                                {allConfigs.map(cfg => (
                                    <div key={cfg.id} className="aq-config-card" onClick={() => {
                                        setSelectedClass(cfg.class_id);
                                        setSelectedSubject(cfg.subjects?.id);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}>
                                        <div className="aq-config-top">
                                            <div className={`aq-config-type-tag ${cfg.question_type}`}>
                                                {cfg.question_type.toUpperCase()}
                                            </div>
                                            <div
                                                className={`aq-config-status-icon ${cfg.is_active ? 'active' : 'hidden'}`}
                                                title={cfg.is_active ? 'Stop Previewing (Hide)' : 'Preview (Make Live)'}
                                                onClick={(e) => toggleLiveStatus(e, cfg)}
                                            >
                                                {cfg.is_active ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                                )}
                                            </div>
                                        </div>
                                        <div className="aq-config-main">
                                            <h4>{cfg.subjects?.subject_name || 'Unknown Subject'}</h4>
                                            <span className="aq-config-class">{cfg.classes?.class_name || 'General'}</span>
                                        </div>
                                        <div className="aq-config-footer">
                                            <span className="aq-config-qcount"><strong>{cfg.question_count}</strong> Questions Set</span>
                                            <div className="aq-config-arrow">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminQuestions;
