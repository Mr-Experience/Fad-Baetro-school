import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import './ActiveExam.css';
import logo from '../../assets/logo.jpg';

const ActiveExam = () => {
    const navigate = useNavigate();
    const [studentName, setStudentName] = useState(sessionStorage.getItem('fad_std_name') || '...');
    const [profileImage, setProfileImage] = useState(sessionStorage.getItem('fad_std_avatar') || null);
    const [activeExam, setActiveExam] = useState(null);
    const [preloadedQuestions, setPreloadedQuestions] = useState(null);
    const [preloadedExamId, setPreloadedExamId] = useState(null); // Track which exam is preloaded
    const [sessionInfo, setSessionInfo] = useState({ session: '', term: '' });
    const [loading, setLoading] = useState(!sessionStorage.getItem('fad_std_name'));

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
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
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
                    const fetchActive = async (isInitial = false) => {
                        try {
                            const [settingsRes, resultsRes] = await Promise.all([
                                supabase.from('system_settings').select('current_session, current_term').eq('id', 1).maybeSingle(),
                                supabase.from('exam_results').select('exam_id, subject_id, question_type').eq('student_id', student.id)
                            ]);

                            const curSession = (settingsRes.data?.current_session || '').trim();
                            const curTerm = (settingsRes.data?.current_term || '').trim();
                            
                            if (settingsRes.data) setSessionInfo({ session: curSession, term: curTerm });

                            const { data: activeExams, error: aeError } = await supabase
                                .from('active_exams')
                                .select('*, exam_configs!inner(*, subjects(subject_name))')
                                .eq('exam_configs.class_id', student.class_id)
                                .eq('is_active', true)
                                .eq('session_id', curSession)
                                .eq('term_id', curTerm)
                                .order('visible_at', { ascending: true });

                            if (!aeError && activeExams && activeExams.length > 0) {
                                const results = resultsRes.data || [];
                                const now = Date.now();
                                
                                const filteredExams = activeExams.filter(ae => {
                                    const cfg = ae.exam_configs;
                                    const examStartTime = ae.visible_at ? new Date(ae.visible_at).getTime() : 0;
                                    const examExpiryTime = examStartTime + (cfg.duration_minutes || 60) * 60 * 1000;
                                    return !ae.visible_at || now < examExpiryTime;
                                });

                                if (filteredExams.length === 0) {
                                    setLoading(false);
                                    if (intervalId) clearInterval(intervalId);
                                    navigate('/portal/student/no-exam', { replace: true });
                                    return;
                                }

                                const takenExamIds = new Set(results.map(r => r.exam_id));
                                const takenKeys = new Set(results.map(r => `${r.subject_id}_${r.question_type}`));

                                const availableAE = filteredExams.find(ae => {
                                    const cfg = ae.exam_configs;
                                    const notTaken = !takenExamIds.has(cfg.id) && !takenKeys.has(`${cfg.subject_id}_${cfg.question_type}`);
                                    const isTimeReady = !ae.visible_at || now >= new Date(ae.visible_at).getTime();
                                    return notTaken && isTimeReady;
                                });

                                const allTaken = filteredExams.every(ae => {
                                    const cfg = ae.exam_configs;
                                    return takenExamIds.has(cfg.id) || takenKeys.has(`${cfg.subject_id}_${cfg.question_type}`);
                                });

                                if (availableAE) {
                                    const combinedConfig = {
                                        ...availableAE.exam_configs,
                                        visible_at: availableAE.visible_at,
                                        is_active_ae: availableAE.is_active,
                                        active_exam_id: availableAE.id
                                    };
                                    
                                    setActiveExam(prev => (prev?.id === combinedConfig.id ? prev : combinedConfig));

                                    if (!preloadedQuestions || preloadedExamId !== availableAE.id) {
                                        setPreloadedExamId(availableAE.id);
                                        
                                        supabase.from('questions')
                                            .select('*')
                                            .eq('class_id', availableAE.exam_configs.class_id)
                                            .eq('subject_id', availableAE.exam_configs.subject_id)
                                            .eq('question_type', availableAE.exam_configs.question_type)
                                            .eq('session_id', curSession)
                                            .eq('term_id', curTerm)
                                            .then(({ data: qData }) => {
                                                if (qData) {
                                                    let processed = [...qData];
                                                    if (availableAE.exam_configs.selection_type === 'random') {
                                                        processed = processed.sort(() => Math.random() - 0.5);
                                                    }
                                                    const count = availableAE.exam_configs.question_count || processed.length;
                                                    setPreloadedQuestions(processed.slice(0, count === 0 ? processed.length : count));
                                                }
                                            })
.catch(err => {
                                                console.error("Question Preload Error:", err);
                                                setPreloadedQuestions([]); // Prevent stuck loading
                                            });
                                    }

                                    setLoading(false);
                                    return;
                                } else if (allTaken) {
                                    setLoading(false);
                                    if (intervalId) clearInterval(intervalId);
                                    navigate('/portal/student/submitted', { replace: true });
                                    return;
                                }
                            }

                            setLoading(false);
                            if (intervalId) clearInterval(intervalId);
                            navigate('/portal/student/no-exam');
                        } catch (err) {
                            console.error("fetchActive Error:", err);
                            setLoading(false);
                        }
                    };

                    fetchActive(true);
                    // Optimized Polling: 15s interval with 5s random jitter to prevent "Thundering Herd" load on database
                    intervalId = setInterval(() => fetchActive(false), 15000 + (Math.random() * 5000));

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

    // Unified Persistent Shell Render
    const renderHeader = () => (
        <header className="portal-header-bar nes-header">
            <div className="nes-header-left">
                <img src={logo} alt="Logo" className="portal-logo-img" />
                <h1 className="portal-school-name">Fad Maestro Academy</h1>
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
    );

    if (loading && !activeExam) {
        return (
            <div className="portal-login-container">
                {renderHeader()}
                <main className="portal-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="qe-spinner" style={{ width: '40px', height: '40px', borderTopColor: '#9D245A' }}></div>
                </main>
            </div>
        );
    }

    return (
        <div className="portal-login-container">
            {/* Header */}
            {renderHeader()}

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

                    <button
                        className="login-btn ae-start-btn"
                        onClick={async () => {
                            if (!activeExam || !preloadedQuestions) return;

                            // 1. Fetch Student from DB (to get ID)
                            const { data: { user } } = await supabase.auth.getUser();
                            const { data: std } = await supabase.from('profiles').select('id').eq('id', user.id).single();

                            if (std) {
                                // 2. Record Attempt (Step 5)
                                const startTime = new Date();
                                const durationSec = (activeExam.duration_minutes || 60) * 60;
                                const individualEndTime = new Date(startTime.getTime() + (durationSec * 1000));

                                // Session End (Strict Cutoff)
                                let finalEndTime = individualEndTime;
                                if (activeExam.visible_at) {
                                    const scheduledStart = new Date(activeExam.visible_at).getTime();
                                    const classWindowEnd = new Date(scheduledStart + (durationSec * 1000));
                                    // Use the class window end if it's earlier than individual time (strict cutoff)
                                    if (classWindowEnd < individualEndTime) {
                                        finalEndTime = classWindowEnd;
                                    }
                                }

                                await supabase.from('exam_attempts').insert({
                                    student_id: std.id,
                                    exam_id: activeExam.id,
                                    start_time: startTime.toISOString(),
                                    end_time: finalEndTime.toISOString(),
                                    session_id: sessionInfo.session,
                                    term_id: sessionInfo.term,
                                    status: 'started'
                                });
                            }

                            navigate('/portal/student/exam', {
                                state: { examConfig: activeExam, preloadedQuestions, sessionInfo }
                            });
                        }}
                        disabled={!activeExam || !preloadedQuestions || preloadedQuestions.length === 0}
                    >
                        {!preloadedQuestions ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                <div className="qe-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderTopColor: '#fff' }}></div>
                                Check Paper status...
                            </div>
                        ) : (
                            preloadedQuestions.length > 0 ? 'Start Exam Now' : 'No Questions Found'
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ActiveExam;
