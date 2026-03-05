import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import html2canvas from 'html2canvas';
import './AdminResults.css';

const AdminResults = () => {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedType, setSelectedType] = useState('all'); // 'all', 'test', 'exam', 'candidate'

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const resultsRef = useRef(null);

    // Fetch Classes
    useEffect(() => {
        const fetchClasses = async () => {
            const { data, error } = await supabase.from('classes').select('id, name').order('name');
            if (!error && data) setClasses(data);
        };
        fetchClasses();
    }, []);

    // Fetch Subjects when class changes
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!selectedClassId) {
                setSubjects([]);
                setSelectedSubjectId('');
                return;
            }
            const { data, error } = await supabase
                .from('subjects')
                .select('id, subject_name')
                .eq('class_id', selectedClassId)
                .order('subject_name');
            if (!error && data) setSubjects(data);
        };
        fetchSubjects();
    }, [selectedClassId]);

    // Fetch Results when filters change
    useEffect(() => {
        const fetchResults = async () => {
            if (!selectedClassId) {
                setResults([]);
                return;
            }

            setLoading(true);
            let query = supabase
                .from('exam_results')
                .select(`
                    *,
                    students (
                        full_name,
                        email,
                        image_url
                    )
                `)
                .eq('class_id', selectedClassId)
                .order('completed_at', { ascending: false });

            if (selectedSubjectId) {
                query = query.eq('subject_id', selectedSubjectId);
            }
            if (selectedType !== 'all') {
                query = query.eq('question_type', selectedType);
            }

            const { data, error } = await query;

            if (!error && data) {
                setResults(data);
            }
            setLoading(false);
        };
        fetchResults();
    }, [selectedClassId, selectedSubjectId, selectedType]);

    // Group results by subject
    const groupedResults = results.reduce((acc, result) => {
        const key = result.subject_name || result.subject_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(result);
        return acc;
    }, {});

    const handleDownloadCSV = (subjectName, subjectResults) => {
        const headers = ["S/N", "Student Name", "Email", "Type", "Score (%)", "Correct", "Total", "Date"];
        const rows = subjectResults.map((res, idx) => [
            idx + 1,
            res.students?.full_name || 'N/A',
            res.students?.email || 'N/A',
            res.question_type?.toUpperCase() || 'N/A',
            res.score_percent,
            res.correct_answers,
            res.total_questions,
            new Date(res.completed_at).toLocaleDateString()
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const clsName = classes.find(c => c.id === selectedClassId)?.name || 'Results';
        link.setAttribute("download", `${clsName}_${subjectName}_Results.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadImage = async (subjectName) => {
        const elementId = `result-table-${subjectName.replace(/\s+/g, '-')}`;
        const element = document.getElementById(elementId);

        if (element) {
            try {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });
                const image = canvas.toDataURL("image/png");
                const link = document.createElement('a');
                link.href = image;
                const clsName = classes.find(c => c.id === selectedClassId)?.name || 'Class';
                link.download = `${clsName}_${subjectName}_Results.png`;
                link.click();
            } catch (err) {
                console.error("Failed to generate image:", err);
                alert("Could not generate the image.");
            }
        }
    };

    return (
        <div className="admin-results-container">
            <div className="ar-header">
                <h2>Exam Results Center</h2>
                <p>Filter by class and exam type to preview and print student scores.</p>
            </div>

            <div className="ar-filters">
                <div className="ar-filter-group">
                    <label>Class</label>
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="ar-select"
                    >
                        <option value="">Select Class...</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="ar-filter-group">
                    <label>Subject</label>
                    <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="ar-select"
                        disabled={!selectedClassId}
                    >
                        <option value="">All Subjects</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.subject_name}</option>
                        ))}
                    </select>
                </div>

                <div className="ar-filter-group">
                    <label>Type</label>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="ar-select"
                    >
                        <option value="all">All Types</option>
                        <option value="test">Test</option>
                        <option value="exam">Exam</option>
                        <option value="candidate">Candidate</option>
                    </select>
                </div>
            </div>

            <div className="ar-content" ref={resultsRef}>
                {loading ? (
                    <div className="ar-loading-spinner">
                        <div className="spinner"></div>
                        <span>Analyzing results...</span>
                    </div>
                ) : !selectedClassId ? (
                    <div className="ar-empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="9" y1="21" x2="9" y2="9" />
                        </svg>
                        <p>Select a class and exam type to view results</p>
                    </div>
                ) : Object.keys(groupedResults).length === 0 ? (
                    <div className="ar-empty-state">
                        <p>No results found for this class and exam type yet.</p>
                    </div>
                ) : (
                    <div className="ar-subject-list">
                        {Object.entries(groupedResults).map(([subject, subjectResults]) => {
                            const className = classes.find(c => c.id === selectedClassId)?.name || 'Unknown Class';
                            return (
                                <div key={subject} className="ar-subject-card" id={`result-table-${subject.replace(/\s+/g, '-')}`}>
                                    <div className="ar-subject-header">
                                        <div className="ar-subject-title">
                                            <h3>{subject}</h3>
                                            <p>{className} • {subjectResults.length} Submissions</p>
                                        </div>
                                        <div className="ar-actions-group" data-html2canvas-ignore="true">
                                            <button
                                                className="ar-action-btn csv"
                                                onClick={() => handleDownloadCSV(subject, subjectResults)}
                                                title="Download CSV"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                    <line x1="16" y1="13" x2="8" y2="13" />
                                                    <line x1="16" y1="17" x2="8" y2="17" />
                                                    <polyline points="10 9 9 9 8 9" />
                                                </svg>
                                                <span>CSV</span>
                                            </button>
                                            <button
                                                className="ar-action-btn image"
                                                onClick={() => handleDownloadImage(subject)}
                                                title="Download Image"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                <span>PNG</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="ar-table-responsive">
                                        <table className="ar-table">
                                            <thead>
                                                <tr>
                                                    <th>S/N</th>
                                                    <th>Student Details</th>
                                                    <th>Type</th>
                                                    <th>Score</th>
                                                    <th>Accuracy</th>
                                                    <th>Completed At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {subjectResults.map((res, index) => (
                                                    <tr key={res.id}>
                                                        <td>{index + 1}</td>
                                                        <td className="ar-student-cell">
                                                            <div className="ar-student-info">
                                                                <span className="ar-name">{res.students?.full_name || 'Unknown'}</span>
                                                                <span className="ar-email">{res.students?.email || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`ar-type-tag ${res.question_type || 'exam'}`}>
                                                                {res.question_type?.toUpperCase() || 'EXAM'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="ar-score-wrap">
                                                                <span className={`ar-score-value ${Number(res.score_percent) >= 50 ? 'pass' : 'fail'}`}>
                                                                    {res.score_percent}%
                                                                </span>
                                                                <div className="ar-progress-bar">
                                                                    <div
                                                                        className={`ar-progress-fill ${Number(res.score_percent) >= 50 ? 'pass' : 'fail'}`}
                                                                        style={{ width: `${res.score_percent}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="ar-acc-cell">
                                                            <strong>{res.correct_answers}</strong> / {res.total_questions}
                                                        </td>
                                                        <td className="ar-date-cell">
                                                            {new Date(res.completed_at).toLocaleDateString(undefined, {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="ar-print-footer">
                                        Generared dynamically by Fad Mastro Academy System
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminResults;
