import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import './ActiveExam.css';
import logo from '../../assets/logo.jpg';

const ActiveExam = () => {
    const navigate = useNavigate();
    const [studentName, setStudentName] = useState('...');
    const [profileImage, setProfileImage] = useState(null);
    const [activeExam, setActiveExam] = useState(null);
    const [preloadedQuestions, setPreloadedQuestions] = useState(null);
    const [sessionInfo, setSessionInfo] = useState({ session: '', term: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let intervalId;

        const getData = async () => {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                console.error("Auth error or no user:", authError);
                navigate('/portal/student');
                return;
            }

            try {
                // 1. Fetch Student Identity & Class
                const { data: student, error: fetchError } = await supabase
                    .from('students')
                    .select('*')
                    .eq('email', user.email.toLowerCase())
                    .maybeSingle();

                if (fetchError) {
                    console.warn("Error fetching student profile:", fetchError.message);
                    setLoading(false);
                } else if (student) {
                    // ... Profile image logic ...
                    const displayName = student.full_name || student.name || user.user_metadata?.full_name || user.email;
                    setStudentName(displayName);

                    if (student.image_url) setProfileImage(student.image_url);
                    else if (student.profile_image) setProfileImage(student.profile_image);
                    else if (student.profile_picture) setProfileImage(student.profile_picture);
                    else if (student.avatar_url) setProfileImage(student.avatar_url);

                    if (!student.class_id) {
                        setLoading(false);
                        navigate('/portal/student/no-exam');
                        return;
                    }

                    // 2. Setup Active Exam Check
                    const fetchActive = async () => {
                        try {
                            const { data: sData } = await supabase
                                .from('system_settings')
                                .select('current_session, current_term')
                                .maybeSingle();

                            const curSession = sData?.current_session || '';
                            const curTerm = sData?.current_term || '';
                            if (sData) setSessionInfo({ session: curSession, term: curTerm });

                            const { data: activeConfigs, error } = await supabase
                                .from('exam_configs')
                                .select('*, subjects(subject_name)')
                                .eq('class_id', student.class_id)
                                .eq('is_active', true);

                            if (!error && activeConfigs && activeConfigs.length > 0) {
                                const { data: results } = await supabase
                                    .from('exam_results')
                                    .select('subject_id, question_type')
                                    .eq('student_id', student.id)
                                    .eq('session_id', curSession)
                                    .eq('term_id', curTerm);

                                const takenKeys = new Set(results?.map(r => `${r.subject_id}_${r.question_type}`) || []);
                                const availableExam = activeConfigs.find(c => !takenKeys.has(`${c.subject_id}_${c.question_type}`));

                                if (availableExam) {
                                    setActiveExam(availableExam);

                                    if (!preloadedQuestions) {
                                        supabase.from('questions')
                                            .select('*')
                                            .eq('class_id', availableExam.class_id)
                                            .eq('subject_id', availableExam.subject_id)
                                            .eq('question_type', availableExam.question_type)
                                            .then(({ data: qData }) => {
                                                if (qData) {
                                                    let processed = [...qData];
                                                    if (availableExam.selection_type === 'random') {
                                                        processed = processed.sort(() => Math.random() - 0.5);
                                                    }
                                                    const count = availableExam.question_count || processed.length;
                                                    setPreloadedQuestions(processed.slice(0, count));
                                                }
                                            }).catch(err => console.error(err));
                                    }

                                    setLoading(false);
                                    return;
                                }
                            }

                            navigate('/portal/student/no-exam');
                        } catch (err) {
                            console.error("fetchActive Error:", err);
                        }
                    };

                    fetchActive();
                    intervalId = setInterval(fetchActive, 1500);

                } else {
                    const fallbackName = user.user_metadata?.full_name || user.email;
                    setStudentName(fallbackName);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error in getData:", error);
                setStudentName(user?.email || '...');
                setLoading(false);
            }
        };
        getData();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [navigate]);

    if (loading) {
        return (
            <div className="portal-login-container" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <img src={logo} alt="School Logo" style={{ width: '100px', height: '100px', borderRadius: '50%', animation: 'pulse-load 1.5s ease-in-out infinite' }} />
                <style>{`
                    @keyframes pulse-load {
                        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(157, 36, 90, 0.4); }
                        70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(157, 36, 90, 0); }
                        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(157, 36, 90, 0); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="portal-login-container">
            {/* Header */}
            <header className="portal-header-bar nes-header">
                <div className="nes-header-left">
                    <img src={logo} alt="Logo" className="portal-logo-img" />
                    <h1 className="portal-school-name">Fad Mastro Academy</h1>
                </div>
                <div className="nes-header-right">
                    <span className="nes-user-name">{studentName}</span>
                    <div className="nes-avatar">
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="nes-profile-img" />
                        ) : (
                            <span style={{ color: '#4B5563', fontWeight: 'bold', fontSize: '16px' }}>
                                {studentName ? studentName.charAt(0).toUpperCase() : 'S'}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="portal-content">
                <div className="login-card ae-card">

                    {/* Subject icon */}
                    <div className="ae-icon-wrap">
                        {/* Book stack icon */}
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                            stroke="#9D245A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <line x1="9" y1="7" x2="15" y2="7" />
                            <line x1="9" y1="11" x2="12" y2="11" />
                        </svg>
                    </div>

                    {/* Subject name */}
                    <h2 className="ae-subject">{activeExam?.subjects?.subject_name || 'Loading exam...'}</h2>

                    {/* Instructions */}
                    <p className="ae-instructions-heading">Read the following instructions carefully:</p>
                    <ul className="ae-instructions-list">
                        <li>Read each question carefully; only one option is correct</li>
                        <li>Do not refresh or close the browser during the exam.</li>
                        <li>You can review and change answers before submission.</li>
                        <li>Click Submit only when finished; submission is final.</li>
                        <li>The exam auto-submits when time expires.</li>
                    </ul>

                    {/* Start button */}
                    <button
                        className="login-btn ae-start-btn"
                        onClick={() => navigate('/portal/student/exam', { state: { examConfig: activeExam, preloadedQuestions, sessionInfo } })}
                        disabled={!activeExam || !preloadedQuestions}
                    >
                        {preloadedQuestions ? 'Start now' : 'Loading exam paper...'}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ActiveExam;
