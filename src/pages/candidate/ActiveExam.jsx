import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import './ActiveExam.css';
import logo from '../../assets/logo.jpg';

const ActiveExam = () => {
    const navigate = useNavigate();
    const [candidateName, setCandidateName] = useState('...');
    const [profileImage, setProfileImage] = useState(null);
    const [activeExam, setActiveExam] = useState(null);
    const [preloadedQuestions, setPreloadedQuestions] = useState(null);
    const [sessionInfo, setSessionInfo] = useState({ session: '', term: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let intervalId;

        const getData = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) {
                    navigate('/portal/candidate');
                    return;
                }

                // 1. Fetch Candidate Identity
                // Candidates are often in the students table with a specific class
                let { data: student, error: fetchError } = await supabase
                    .from('profiles')
                    .select('full_name, profile_image, image_url, class_id')
                    .eq('id', user.id)
                    .maybeSingle();

                let candidateId = user.id;

                if (student) {
                    setCandidateName(student.full_name);
                    setProfileImage(student.image_url || student.profile_image || null);
                    candidateId = student.id;
                } else {
                    // If not in students table, fallback to metadata
                    setCandidateName(user.user_metadata?.full_name || user.email);
                }

                // 2. Initial Fetch for Active Candidate Exam
                const fetchActive = async () => {
                    try {
                        const { data: sData } = await supabase
                            .from('system_settings')
                            .select('current_session, current_term')
                            .maybeSingle();

                        const curSession = (sData?.current_session || '').trim();
                        const curTerm = (sData?.current_term || '').trim();
                        if (sData) setSessionInfo({ session: curSession, term: curTerm });

                        const { data: activeConfigs, error } = await supabase
                            .from('exam_configs')
                            .select('*, subjects(subject_name)')
                            .eq('class_id', student?.class_id || null)
                            .eq('question_type', 'candidate')
                            .eq('is_active', true)
                            .eq('session_id', curSession)
                            .eq('term_id', curTerm)
                            .order('visible_at', { ascending: true });

                        if (!error && activeConfigs && activeConfigs.length > 0) {
                            const { data: results } = await supabase
                                .from('exam_results')
                                .select('exam_id, subject_id, question_type')
                                .eq('student_id', candidateId)
                                .eq('session_id', curSession)
                                .eq('term_id', curTerm)
                                .eq('question_type', 'candidate');

                            const now = Date.now();
                            const filteredConfigs = activeConfigs.filter(c => {
                                const examStartTime = c.visible_at ? new Date(c.visible_at).getTime() : 0;
                                const examExpiryTime = examStartTime + (c.duration_minutes || 60) * 60 * 1000;
                                return !c.visible_at || now < examExpiryTime;
                            });

                            if (filteredConfigs.length === 0) {
                                navigate('/portal/candidate/no-exam', { replace: true });
                                return;
                            }

                            const takenExamIds = new Set(results?.map(r => r.exam_id) || []);
                            const takenKeys = new Set(results?.map(r => `${r.subject_id}_candidate`) || []);

                            const availableExam = filteredConfigs.find(c => {
                                const notTaken = !takenExamIds.has(c.id) && !takenKeys.has(`${c.subject_id}_candidate`);
                                const isTimeReady = !c.visible_at || now >= new Date(c.visible_at).getTime();
                                return notTaken && isTimeReady;
                            });

                            const allTaken = filteredConfigs.every(c => takenExamIds.has(c.id) || takenKeys.has(`${c.subject_id}_candidate`));

                            if (availableExam) {
                                setActiveExam(availableExam);

                                if (!preloadedQuestions) {
                                    supabase.from('questions')
                                        .select('*')
                                        .eq('class_id', availableExam.class_id)
                                        .eq('subject_id', availableExam.subject_id)
                                        .eq('question_type', 'candidate')
                                        .eq('session_id', curSession)
                                        .eq('term_id', curTerm)
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
                                if (intervalId) clearInterval(intervalId); // Clear interval when an exam is found and ready
                                return;
                            } else if (allTaken) {
                                setLoading(false);
                                if (intervalId) clearInterval(intervalId);
                                navigate('/portal/candidate/submitted', { replace: true });
                                return;
                            }
                        }

                        // If no active configs or no available exam after filtering
                        setLoading(false);
                        if (intervalId) clearInterval(intervalId);
                        navigate('/portal/candidate/no-exam');
                    } catch (err) {
                        console.error("fetchActive Error:", err);
                        setLoading(false);
                        if (intervalId) clearInterval(intervalId); // Ensure interval is cleared on error
                    }
                };

                fetchActive();
                intervalId = setInterval(fetchActive, 1500);

            } catch (error) {
                console.error("Error in getData:", error);
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
            <header className="portal-header-bar nes-header">
                <div className="nes-header-left">
                    <img src={logo} alt="Logo" className="portal-logo-img" />
                    <h1 className="portal-school-name">Fad Maestro Academy</h1>
                </div>
                <div className="nes-header-right">
                    <span className="nes-user-name">{candidateName}</span>
                    <div className="nes-avatar">
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="nes-profile-img" />
                        ) : (
                            <span style={{ color: '#4B5563', fontWeight: 'bold', fontSize: '16px' }}>
                                {candidateName ? candidateName.charAt(0).toUpperCase() : 'C'}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <main className="portal-content">
                <div className="login-card ae-card">
                    <div className="ae-icon-wrap">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                            stroke="#9D245A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <line x1="9" y1="7" x2="15" y2="7" />
                            <line x1="9" y1="11" x2="12" y2="11" />
                        </svg>
                    </div>

                    <h2 className="ae-subject">{activeExam?.subjects?.subject_name || 'Loading instructions...'}</h2>

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
                        onClick={async () => {
                            if (!activeExam || !preloadedQuestions) return;

                            // 1. Fetch Candidate ID
                            const { data: { user } } = await supabase.auth.getUser();
                            let candidateId = user.id;

                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('id')
                                .eq('id', user.id)
                                .maybeSingle();

                            if (profile) {
                                candidateId = profile.id;
                            }

                            // 2. Record Attempt
                            const startTime = new Date();
                            const durationSec = (activeExam.duration_minutes || 60) * 60;
                            const individualEndTime = new Date(startTime.getTime() + (durationSec * 1000));

                            // Session End (Strict Cutoff)
                            let finalEndTime = individualEndTime;
                            if (activeExam.visible_at) {
                                const scheduledStart = new Date(activeExam.visible_at).getTime();
                                const classWindowEnd = new Date(scheduledStart + (durationSec * 1000));
                                if (classWindowEnd < individualEndTime) {
                                    finalEndTime = classWindowEnd;
                                }
                            }

                            await supabase.from('exam_attempts').insert({
                                student_id: candidateId,
                                exam_id: activeExam.id,
                                start_time: startTime.toISOString(),
                                end_time: finalEndTime.toISOString(),
                                session_id: sessionInfo.session,
                                term_id: sessionInfo.term,
                                status: 'started'
                            });

                            navigate('/portal/candidate/exam', {
                                state: { examConfig: activeExam, preloadedQuestions, sessionInfo }
                            });
                        }}
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
