import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminHeader from '../../components/AdminHeader';
import { Download, Users, CheckCircle, ArrowLeft, Printer, TrendingUp } from 'lucide-react';
import './AdminResultDetail.css';

const AdminResultDetail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const classId = searchParams.get('classId') || '';
    const subjectId = searchParams.get('subjectId') || '';
    const className = searchParams.get('className') || 'Unknown Class';
    const subjectName = searchParams.get('subjectName') || 'Unknown Subject';
    const questionType = searchParams.get('type') || 'test';

    const {
        activeSession: globalSession,
        activeTerm: globalTerm,
        profileLoading: globalProfileLoading,
        userName: globalUserName,
        userRole: globalUserRole,
        userInitial: globalUserInitial,
        avatarUrl: globalAvatarUrl
    } = useOutletContext();

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    // Stats
    const [totalStudents, setTotalStudents] = useState(0);
    const [submissionCount, setSubmissionCount] = useState(0);
    const [avgScore, setAvgScore] = useState(0);

    useEffect(() => {
        const init = async () => {
            if (globalProfileLoading) {
                setLoading(true);
                return;
            }

            if (!globalSession || !globalTerm) {
                console.warn("Global session or term not available yet.");
                setLoading(true);
                return;
            }

            setLoading(true);
            try {
                // 3. Fetch stats and results
                if (classId && subjectId && globalSession && globalTerm) {
                    const sKey = globalSession.trim();
                    const tKey = globalTerm.trim();

                    // Total students in class
                    const { count } = await supabase
                        .from('profiles')
                        .select('*', { count: 'exact', head: true })
                        .eq('role', 'student')
                        .eq('class_id', classId);
                    setTotalStudents(count || 0);

                    // Submissions
                    let query = supabase
                        .from('exam_results')
                        .select(`
                            id, 
                            student_id,
                            score_percent, 
                            correct_answers, 
                            total_questions, 
                            submitted_at,
                            session_id,
                            term_id,
                            profiles(full_name, email, avatar_url)
                        `)
                        .eq('class_id', classId)
                        .eq('question_type', questionType);

                    if (subjectId === 'unknown') {
                        query = query.is('subject_id', null);
                    } else {
                        query = query.eq('subject_id', subjectId);
                    }

                    const { data: resData, error: resError } = await query.order('score_percent', { ascending: false });

                    if (resError) throw resError;

                    if (resData) {
                        // ROBUST FILTERING: Handle potentially mismatched whitespace or casing
                        const filtered = resData.filter(r => {
                            const dbSession = (r.session_id || '').trim().toLowerCase();
                            const dbTerm = (r.term_id || '').trim().toLowerCase();
                            const targetS = sKey.toLowerCase();
                            const targetT = tKey.toLowerCase();
                            return dbSession === targetS && dbTerm === targetT;
                        });

                        setResults(filtered);
                        setSubmissionCount(filtered.length);

                        if (filtered.length > 0) {
                            const avgValue = Math.round(filtered.reduce((acc, curr) => acc + Number(curr.score_percent || 0), 0) / filtered.length);
                            setAvgScore(avgValue);
                        } else {
                            setAvgScore(0);
                        }
                    }
                }
            } catch (err) {
                console.error("Initiation error:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [classId, subjectId, questionType, globalSession, globalTerm, navigate]);

    const handlePrint = () => window.print();

    const handleExport = () => {
        const headers = ["Rank", "Student Name", "Email", "Score (%)", "Correct", "Total", "Date"];
        const rows = results.map((r, i) => [
            i + 1,
            r.profiles?.full_name || 'N/A',
            r.profiles?.email || 'N/A',
            r.score_percent,
            r.correct_answers,
            r.total_questions,
            new Date(r.submitted_at || r.completed_at).toLocaleDateString()
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${className}_${subjectName}_${questionType}_Results.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="rd-wrapper">

            <div className="rd-container">
                <div className="rd-content-card">
                    <header className="rd-header">
                        <div className="rd-title-group">
                            <button className="qe-back-link" onClick={() => navigate('/portal/admin/results')} style={{ background: 'none', border: 'none', padding: 0 }}>
                                <ArrowLeft size={14} /> Back to Results
                            </button>
                            <h1 className="rd-title">{questionType.toUpperCase()} Results - {subjectName}</h1>
                            <p className="rd-subtitle">{className} | {globalSession} | {globalTerm}</p>
                        </div>

                        <div className="rd-header-actions">
                            <button className="rd-action-btn" onClick={handlePrint}>
                                <Printer size={16} /> Print
                            </button>
                            <button className="rd-action-btn primary" onClick={handleExport}>
                                <Download size={16} /> Download CSV
                            </button>
                        </div>
                    </header>

                    <div className="rd-stats-row">
                        <div className="rd-stat-box">
                            <div className="rd-stat-icon-wrap"><Users size={22} /></div>
                            <div className="rd-stat-info">
                                <span className="rd-stat-val">{loading ? '...' : submissionCount} / {loading ? '...' : totalStudents}</span>
                                <span className="rd-stat-lab">Class Submissions</span>
                            </div>
                        </div>
                        <div className="rd-stat-box">
                            <div className="rd-stat-icon-wrap" style={{ color: '#059669', background: '#ECFDF5' }}><CheckCircle size={22} /></div>
                            <div className="rd-stat-info">
                                <span className="rd-stat-val">{loading ? '...' : submissionCount}</span>
                                <span className="rd-stat-lab">Marked Results</span>
                            </div>
                        </div>
                        <div className="rd-stat-box">
                            <div className="rd-stat-icon-wrap" style={{ color: '#2563EB', background: '#EFF6FF' }}><TrendingUp size={22} /></div>
                            <div className="rd-stat-info">
                                <span className="rd-stat-val">{loading ? '...' : `${avgScore}%`}</span>
                                <span className="rd-stat-lab">Class Average Score</span>
                            </div>
                        </div>
                    </div>

                    <main className="rd-main-list">
                        {loading ? (
                            <div className="rd-loading">
                                <div className="rd-spinner"></div>
                                <p>Analyzing results...</p>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="rd-empty">
                                <span className="rd-empty-icon">📊</span>
                                <h3>No Data Found</h3>
                                <p>No records match your selection for this class/subject.</p>
                            </div>
                        ) : (
                            <div className="rd-table-wrap">
                                <table className="rd-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>{questionType === 'candidate' ? 'Candidate Name' : 'Student Name'}</th>
                                            <th>Score</th>
                                            <th>Accuracy</th>
                                            <th>Date Submitted</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((res, i) => (
                                            <tr key={res.id}>
                                                <td style={{ fontWeight: '700', color: '#6B7280' }}>#{i + 1}</td>
                                                <td className="rd-td-student">
                                                    <span className="rd-student-name">{res.profiles?.full_name || 'Anonymous Student'}</span>
                                                    <span className="rd-student-email">{res.profiles?.email || 'no-email'}</span>
                                                </td>
                                                <td>
                                                    <span className={`rd-score-pill ${Number(res.score_percent) >= 50 ? 'pass' : 'fail'}`}>
                                                        {res.score_percent}%
                                                    </span>
                                                </td>
                                                <td className="rd-accuracy">
                                                    {res.correct_answers} / {res.total_questions} points
                                                </td>
                                                <td className="rd-date">
                                                    {new Date(res.submitted_at || res.completed_at).toLocaleDateString(undefined, {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminResultDetail;
