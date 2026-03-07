import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminHeader from '../../components/AdminHeader';
import { Download, Users, CheckCircle, ArrowLeft, Printer } from 'lucide-react';
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

    // Profile state for header
    const [userName, setUserName] = useState('');
    const [userInitial, setUserInitial] = useState('A');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // 1. SILENT AUTH CHECK
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

                // 2. Fetch DATA (Session/Term)
                const { data: settings } = await supabase
                    .from('system_settings')
                    .select('current_session, current_term')
                    .eq('id', 1)
                    .single();

                if (settings) {
                    setActiveSession(settings.current_session || '');
                    setActiveTerm(settings.current_term || '');
                }

                // 3. Fetch Class Stats
                if (classId) {
                    const { count: studentCount } = await supabase
                        .from('students')
                        .select('*', { count: 'exact', head: true })
                        .eq('class_id', classId);
                    setTotalStudents(studentCount || 0);
                }

                // 4. Fetch RESULTS
                if (classId && subjectId) {
                    const { data, error } = await supabase
                        .from('exam_results')
                        .select(`
                            id, 
                            score_percent, 
                            correct_answers, 
                            total_questions, 
                            submitted_at,
                            completed_at,
                            profiles (full_name, email)
                        `)
                        .eq('class_id', classId)
                        .eq('subject_id', subjectId)
                        .eq('question_type', questionType)
                        .eq('session_id', settings.current_session)
                        .eq('term_id', settings.current_term)
                        .order('score_percent', { ascending: false });

                    if (data) {
                        setResults(data);
                        setSubmissionCount(data.length);
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

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        // Simple CSV export
        const headers = ["Student Name", "Email", "Score (%)", "Correct", "Total", "Date"];
        const rows = results.map(r => [
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
                <div className="rd-sidebar">
                    <button className="rd-back-btn" onClick={() => navigate('/portal/admin/results')}>
                        <ArrowLeft size={18} />
                        Back to Overview
                    </button>

                    <div className="rd-stats-card">
                        <div className="rd-stat-header">
                            <Users size={20} />
                            <span>Class Status</span>
                        </div>
                        <div className="rd-stat-body">
                            <div className="rd-stat-main">
                                <span className="rd-stat-number">{submissionCount}</span>
                                <span className="rd-stat-label">Submissions</span>
                            </div>
                            <div className="rd-progress-track">
                                <div
                                    className="rd-progress-bar"
                                    style={{ width: `${totalStudents > 0 ? (submissionCount / totalStudents) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <p className="rd-stat-desc">
                                Out of {totalStudents} students in this class.
                            </p>
                        </div>
                    </div>

                    <div className="rd-stats-card performance">
                        <div className="rd-stat-header">
                            <CheckCircle size={20} />
                            <span>Average Score</span>
                        </div>
                        <div className="rd-stat-body">
                            <div className="rd-stat-main">
                                <span className="rd-stat-number">
                                    {results.length > 0
                                        ? Math.round(results.reduce((acc, curr) => acc + Number(curr.score_percent), 0) / results.length)
                                        : 0}%
                                </span>
                                <span className="rd-stat-label">Class Average</span>
                            </div>
                        </div>
                    </div>

                    <div className="rd-actions-card">
                        <h3>Actions</h3>
                        <div className="rd-action-btns">
                            <button className="rd-action-btn print" onClick={handlePrint}>
                                <Printer size={18} />
                                Print Results
                            </button>
                            <button className="rd-action-btn download" onClick={handleExport}>
                                <Download size={18} />
                                Download CSV
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rd-main-content">
                    <div className="rd-content-header">
                        <div className="rd-title-group">
                            <h1 className="rd-title">{questionType.toUpperCase()} Results</h1>
                            <p className="rd-subtitle">{className} • {subjectName} • {activeSession} • {activeTerm}</p>
                        </div>
                    </div>

                    <div className="rd-table-card">
                        {loading ? (
                            <div className="rd-loading">
                                <div className="rd-spinner"></div>
                                <p>Loading results...</p>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="rd-empty">
                                <span className="rd-empty-icon">📊</span>
                                <h3>No results yet</h3>
                                <p>No student has submitted this {questionType} for the current session.</p>
                            </div>
                        ) : (
                            <table className="rd-table">
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Status</th>
                                        <th>Score</th>
                                        <th>Accuracy</th>
                                        <th>Submission Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((res, i) => (
                                        <tr key={res.id}>
                                            <td className="rd-td-student">
                                                <div className="rd-student-name">{res.profiles?.full_name || 'Unknown'}</div>
                                                <div className="rd-student-email">{res.profiles?.email}</div>
                                            </td>
                                            <td>
                                                <span className="rd-status-badge">Submitted</span>
                                            </td>
                                            <td>
                                                <div className={`rd-score-pill ${Number(res.score_percent) >= 50 ? 'pass' : 'fail'}`}>
                                                    {res.score_percent}%
                                                </div>
                                            </td>
                                            <td className="rd-accuracy">
                                                {res.correct_answers} / {res.total_questions}
                                            </td>
                                            <td className="rd-date">
                                                {new Date(res.submitted_at || res.completed_at).toLocaleDateString(undefined, {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminResultDetail;
