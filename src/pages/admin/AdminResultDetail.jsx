import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSession, setActiveSession] = useState('');
    const [activeTerm, setActiveTerm] = useState('');

    // Stats
    const [totalStudents, setTotalStudents] = useState(0);
    const [submissionCount, setSubmissionCount] = useState(0);
    const [avgScore, setAvgScore] = useState(0);

    // Profile state for header
    const [userName, setUserName] = useState('');
    const [userInitial, setUserInitial] = useState('A');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // 1. AUTH CHECK
                let { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    navigate('/portal/admin/login');
                    return;
                }

                // Verify Role
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
                if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
                    navigate('/portal/admin/login');
                    return;
                }

                // Restore Profile Data
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', session.user.id)
                    .single();

                if (profileData) {
                    setUserName(profileData.full_name || session.user.email?.split('@')[0]);
                    setUserInitial((profileData.full_name || 'A').charAt(0).toUpperCase());
                    setAvatarUrl(profileData.avatar_url);
                }
                setProfileLoading(false);

                // 2. Fetch Settings
                const { data: settings } = await supabase
                    .from('system_settings')
                    .select('current_session, current_term')
                    .eq('id', 1)
                    .single();

                if (settings) {
                    setActiveSession((settings.current_session || '').trim());
                    setActiveTerm((settings.current_term || '').trim());
                }

                // 3. Fetch stats and results
                if (classId && subjectId) {
                    // Total students in class
                    const { count } = await supabase
                        .from('profiles')
                        .select('*', { count: 'exact', head: true })
                        .eq('class_id', classId);
                    setTotalStudents(count || 0);

                    // Submissions
                    const { data: resData } = await supabase
                        .from('exam_results')
                        .select(`
                            id, 
                            score_percent, 
                            correct_answers, 
                            total_questions, 
                            submitted_at,
                            completed_at,
                            profiles:student_id (full_name, email)
                        `)
                        .eq('class_id', classId)
                        .eq('subject_id', subjectId)
                        .eq('question_type', questionType)
                        .eq('session_id', (activeSession || '').trim())
                        .eq('term_id', (activeTerm || '').trim())
                        .order('score_percent', { ascending: false });

                    if (resData) {
                        setResults(resData);
                        setSubmissionCount(resData.length);

                        if (resData.length > 0) {
                            const avgValue = Math.round(resData.reduce((acc, curr) => acc + Number(curr.score_percent), 0) / resData.length);
                            setAvgScore(avgValue);
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
    }, [classId, subjectId, questionType, navigate]);

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
            <AdminHeader
                profileLoading={profileLoading}
                userName={userName}
                userInitial={userInitial}
                avatarUrl={avatarUrl}
                activeSession={activeSession}
                activeTerm={activeTerm}
            />

            <div className="rd-container">
                <div className="rd-content-card">
                    <header className="rd-header">
                        <div className="rd-title-group">
                            <button className="qe-back-link" onClick={() => navigate('/portal/admin/results')} style={{ background: 'none', border: 'none', padding: 0 }}>
                                <ArrowLeft size={14} /> Back to Results
                            </button>
                            <h1 className="rd-title">{questionType.toUpperCase()} Results - {subjectName}</h1>
                            <p className="rd-subtitle">{className} | {activeSession} | {activeTerm}</p>
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
                                <span className="rd-stat-val">{submissionCount} / {totalStudents}</span>
                                <span className="rd-stat-lab">Total Submissions</span>
                            </div>
                        </div>
                        <div className="rd-stat-box">
                            <div className="rd-stat-icon-wrap" style={{ color: '#059669', background: '#ECFDF5' }}><CheckCircle size={22} /></div>
                            <div className="rd-stat-info">
                                <span className="rd-stat-val">{submissionCount}</span>
                                <span className="rd-stat-lab">Marked Results</span>
                            </div>
                        </div>
                        <div className="rd-stat-box">
                            <div className="rd-stat-icon-wrap" style={{ color: '#2563EB', background: '#EFF6FF' }}><TrendingUp size={22} /></div>
                            <div className="rd-stat-info">
                                <span className="rd-stat-val">{avgScore}%</span>
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
                                            <th>Candidate Name</th>
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
