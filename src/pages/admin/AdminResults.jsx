import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { CheckCircle } from 'lucide-react';
import './AdminResults.css';

const AdminResults = () => {
    const { classes, activeSession, activeTerm } = useOutletContext();
    const [subjects, setSubjects] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Results summary state
    const [resultsSummary, setResultsSummary] = useState([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ title: '', type: '', results: [] });

    // Fetch Subjects when class changes
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!selectedClassId) {
                setSubjects([]);
                setSelectedSubjectId('');
                setResultsSummary([]);
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

    // Fetch Summary when class/subject changes
    useEffect(() => {
        const fetchSummary = async () => {
            if (!selectedClassId || subjects.length === 0) return;
            setLoading(true);

            try {
                let query = supabase
                    .from('exam_results')
                    .select('id, subject_id, question_type')
                    .eq('class_id', selectedClassId)
                    .eq('session_id', activeSession)
                    .eq('term_id', activeTerm);

                if (selectedSubjectId) {
                    query = query.eq('subject_id', selectedSubjectId);
                }

                const { data: allResults } = await query;

                const relevantSubjects = selectedSubjectId
                    ? subjects.filter(s => s.id === selectedSubjectId)
                    : subjects;

                const summary = relevantSubjects.map(sub => {
                    const subResults = allResults?.filter(r => r.subject_id === sub.id) || [];
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
                console.error("Error fetching summary:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [selectedClassId, selectedSubjectId, subjects]);

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

            {/* Modal */}
            {showModal && (
                <div className="ar-modal-overlay">
                    <div className="ar-modal">
                        <header className="ar-modal-header">
                            <div className="ar-modal-title">
                                <h2>{modalData.title}</h2>
                                <p>{modalData.results.length} student submissions found</p>
                            </div>
                            <button className="ar-close-btn" onClick={() => setShowModal(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </header>

                        <div className="ar-table-wrap">
                            <table className="ar-table">
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Score</th>
                                        <th>Accuracy</th>
                                        <th>Date Sent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modalData.results.map(res => (
                                        <tr key={res.id}>
                                            <td>
                                                <div style={{ fontWeight: '600' }}>{res.profiles?.full_name || 'Unknown'}</div>
                                                <div style={{ fontSize: '12px', color: '#6B7280' }}>{res.profiles?.email}</div>
                                            </td>
                                            <td>
                                                <span className={`ar-score-badge ${Number(res.score_percent) >= 50 ? 'pass' : 'fail'}`}>
                                                    {res.score_percent}%
                                                </span>
                                            </td>
                                            <td>{res.correct_answers} / {res.total_questions}</td>
                                            <td>{new Date(res.submitted_at || res.completed_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {modalData.results.length === 0 && (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminResults;
