import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import html2canvas from 'html2canvas';
import './AdminResults.css';

const AdminResults = () => {
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [examTypes, setExamTypes] = useState(['student', 'candidate']); // Add "test" if it exists in your schema
    const [selectedType, setSelectedType] = useState('');

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const resultsRef = useRef(null);

    // Fetch Classes
    useEffect(() => {
        const fetchClasses = async () => {
            const { data, error } = await supabase.from('classes').select('id, name').order('name');
            if (!error && data) {
                setClasses(data);
            }
        };
        fetchClasses();
    }, []);

    // Fetch Results when class and type change
    useEffect(() => {
        const fetchResults = async () => {
            if (!selectedClassId || !selectedType) {
                setResults([]);
                return;
            }

            setLoading(true);
            const { data, error } = await supabase
                .from('exam_results')
                .select(`
                    id, 
                    student_id, 
                    score_percent, 
                    correct_answers, 
                    total_questions, 
                    completed_at, 
                    subject_id, 
                    subject_name,
                    question_type,
                    students (
                        full_name,
                        email
                    )
                `)
                .eq('class_id', selectedClassId)
                .eq('question_type', selectedType)
                .order('completed_at', { ascending: false });

            if (!error && data) {
                setResults(data);
            }
            setLoading(false);
        };
        fetchResults();
    }, [selectedClassId, selectedType]);

    // Group results by subject
    const groupedResults = results.reduce((acc, result) => {
        const key = result.subject_name || result.subject_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(result);
        return acc;
    }, {});

    const handleDownloadImage = async (subjectName) => {
        const elementId = `result-table-${subjectName.replace(/\s+/g, '-')}`;
        const element = document.getElementById(elementId);

        if (element) {
            try {
                // Ensure text colors are maintained properly for printing
                const originalBg = element.style.backgroundColor;
                element.style.backgroundColor = '#ffffff';

                const canvas = await html2canvas(element, { scale: 2 });
                element.style.backgroundColor = originalBg;

                const image = canvas.toDataURL("image/png");

                // Trigger download
                const link = document.createElement('a');
                link.href = image;

                const clsName = classes.find(c => c.id === selectedClassId)?.name || 'Class';
                link.download = `${clsName}_${selectedType}_${subjectName}_Results.png`;
                link.click();
            } catch (err) {
                console.error("Failed to generate image:", err);
                alert("Could not generate the image. Please try again.");
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
                    <label>Class / Target Audience</label>
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
                    <label>Exam Type</label>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="ar-select"
                    >
                        <option value="">Select Exam Type...</option>
                        {examTypes.map(type => (
                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="ar-content" ref={resultsRef}>
                {loading ? (
                    <div className="ar-loading">Fetching results...</div>
                ) : !selectedClassId || !selectedType ? (
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
                                            <span>{className} • {selectedType.toUpperCase()}</span>
                                        </div>
                                        <button
                                            className="ar-download-btn"
                                            onClick={() => handleDownloadImage(subject)}
                                            data-html2canvas-ignore="true" // Prevent the button itself from showing in the printed image
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            Download PNG
                                        </button>
                                    </div>

                                    <div className="ar-table-responsive">
                                        <table className="ar-table">
                                            <thead>
                                                <tr>
                                                    <th>S/N</th>
                                                    <th>Student Name</th>
                                                    <th>Email</th>
                                                    <th>Score (%)</th>
                                                    <th>Correct / Total</th>
                                                    <th>Time Completed</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {subjectResults.map((res, index) => (
                                                    <tr key={res.id}>
                                                        <td>{index + 1}</td>
                                                        <td style={{ fontWeight: '500' }}>{res.students?.full_name || 'Unknown'}</td>
                                                        <td>{res.students?.email || 'N/A'}</td>
                                                        <td>
                                                            <span className={`ar-score-badge ${Number(res.score_percent) >= 50 ? 'pass' : 'fail'}`}>
                                                                {res.score_percent}%
                                                            </span>
                                                        </td>
                                                        <td>{res.correct_answers} / {res.total_questions}</td>
                                                        <td>{new Date(res.completed_at).toLocaleString()}</td>
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
