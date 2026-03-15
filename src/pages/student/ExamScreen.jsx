import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { checkAndPromoteStudent } from '../../utils/promotionService';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import './ExamScreen.css';
import logo from '../../assets/logo.jpg';

const ExamScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const passedExamConfig = location.state?.examConfig;
    const preloadedQuestions = location.state?.preloadedQuestions;
    const passedSessionInfo = location.state?.sessionInfo;

    // Identity & Config
    const [student, setStudent] = useState(null);
    const [studentName, setStudentName] = useState(sessionStorage.getItem('fad_std_name') || '...');
    const [activeConfig, setActiveConfig] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [profileImage, setProfileImage] = useState(sessionStorage.getItem('fad_std_avatar') || null);
    const [sessionInfo, setSessionInfo] = useState({ session: '', term: '' });

    // Exam State
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState({}); // { question_id: 'A' }
    const [timeLeft, setTimeLeft] = useState(null); // in seconds
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const submittingRef = React.useRef(false); // Persistent safety guard

    // --- ACTIONS ---
    const handleAnswer = (option) => {
        const q = questions[currentQuestionIdx];
        const newAnswers = { ...answers, [q.id]: option };
        setAnswers(newAnswers);

        // Save to LocalStorage
        if (student && activeConfig) {
            const storageKey = `exam_prog_${student.id}_${activeConfig.id}`;
            const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
            localStorage.setItem(storageKey, JSON.stringify({ ...existing, answers: newAnswers }));
        }
    };

    const navToQuestion = (idx) => {
        setCurrentQuestionIdx(idx);
        if (student && activeConfig) {
            const storageKey = `exam_prog_${student.id}_${activeConfig.id}`;
            const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
            localStorage.setItem(storageKey, JSON.stringify({ ...existing, currentQuestionIdx: idx }));
        }
    };

    // Use refs for values needed in handleSubmit to prevent unnecessary re-creations 
    // and ensuring we always have the latest state even if the callback is stale
    const answersRef = React.useRef(answers);
    const questionsRef = React.useRef(questions);
    const timeLeftRef = React.useRef(timeLeft);
    const studentRef = React.useRef(student);
    const sessionInfoRef = React.useRef(sessionInfo);

    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { questionsRef.current = questions; }, [questions]);
    useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
    useEffect(() => { studentRef.current = student; }, [student]);
    useEffect(() => { sessionInfoRef.current = sessionInfo; }, [sessionInfo]);

    const handleSubmit = React.useCallback(async (skipConfirm = false) => {
        if (isSubmitting || submittingRef.current) {
            console.log("Submit already in progress, skipping.");
            return;
        }

        // Use the ref values for the latest data
        const currentAnswers = answersRef.current;
        const currentQuestions = questionsRef.current;
        const currentStudent = studentRef.current;
        const currentSessionInfo = sessionInfoRef.current;
        const currentTime = timeLeftRef.current;

        if (!skipConfirm && currentTime > 0 && !window.confirm("Are you sure you want to submit your exam now?")) return;

        submittingRef.current = true;
        setIsSubmitting(true);

        try {
            if (!currentStudent || !activeConfig) throw new Error("Missing student or exam configuration.");

            // Robust Score Calculation
            let correctCount = 0;
            const examQuestions = currentQuestions || [];
            const totalQ = examQuestions.length || 1;
            
            examQuestions.forEach(q => {
                const studentAns = (currentAnswers[q.id] || '').toString().trim().toUpperCase();
                const correctAns = (q.correct_answer || q.correct_option || '').toString().trim().toUpperCase();
                if (studentAns && studentAns === correctAns) {
                    correctCount++;
                }
            });

            const scorePercentFloat = (correctCount / totalQ) * 100;
            const scorePercent = scorePercentFloat.toFixed(1);

            // Fetch class and subject names (Optimistic/Silently)
            let className = '';
            let subjectName = '';
            try {
                const [{ data: cData }, { data: sData }] = await Promise.all([
                    supabase.from('classes').select('class_name').eq('id', currentStudent.class_id).maybeSingle(),
                    supabase.from('subjects').select('subject_name').eq('id', activeConfig.subject_id).maybeSingle()
                ]);
                className = cData?.class_name || '';
                subjectName = sData?.subject_name || '';
            } catch (metaErr) {
                console.warn("Meta fetch failed:", metaErr);
            }

            const sId = (currentSessionInfo.session || '').trim();
            const tId = (currentSessionInfo.term || '').trim();

            if (!sId || !tId) {
                console.error("CRITICAL: Session/Term data missing during submission!");
                throw new Error("Academic session information is missing. Please notify the administrator.");
            }

            const detailedAnswers = examQuestions.map(q => {
                const sAns = (currentAnswers[q.id] || '').toString().trim().toUpperCase();
                const cAns = (q.correct_answer || q.correct_option || '').toString().trim().toUpperCase();
                return {
                    student_id: currentStudent.id,
                    question_id: q.id,
                    selected_option: currentAnswers[q.id] || null,
                    is_correct: sAns && sAns === cAns,
                    session_id: sId,
                    term_id: tId
                };
            });

            // Save to Results Summary
            const { error: insertError } = await supabase
                .from('exam_results')
                .insert({
                    student_id: currentStudent.id,
                    exam_id: activeConfig.id,
                    class_id: currentStudent.class_id,
                    subject_id: activeConfig.subject_id,
                    question_type: activeConfig.question_type,
                    total_questions: examQuestions.length,
                    correct_answers: correctCount,
                    score_percent: scorePercent,
                    answers_json: currentAnswers,
                    submitted_at: new Date().toISOString(),
                    session_id: sId, 
                    term_id: tId,   
                    class_name: className,
                    subject_name: subjectName
                });

            if (insertError) {
                if (insertError.code === '23505') {
                    console.log("Duplicate result detected, probably already submitted.");
                } else {
                    throw insertError;
                }
            } else {
                await supabase.from('student_answers').upsert(detailedAnswers, {
                    onConflict: 'student_id, question_id, session_id, term_id'
                });
            }

            // Update Attempt status
            await supabase
                .from('exam_attempts')
                .update({ status: 'completed' })
                .eq('student_id', currentStudent.id)
                .eq('exam_id', activeConfig.id);

            localStorage.removeItem(`exam_prog_${currentStudent.id}_${activeConfig.id}`);
            
            if (activeConfig.question_type === 'exam') {
                try {
                    await checkAndPromoteStudent(currentStudent.id, currentStudent.class_id, sId, tId);
                } catch (promoErr) {
                    console.error("Non-blocking Promotion Error:", promoErr);
                }
            }

            navigate('/portal/student/submitted', {
                state: { score: scorePercent, name: currentStudent.full_name },
                replace: true
            });

        } catch (err) {
            console.error("Submission Error:", err);
            submittingRef.current = false; // Reset on error to allow manual retry
            setIsSubmitting(false);
            alert(`Error: ${err.message || "Failed to submit."} Please try again.`);
        }
    }, [isSubmitting, activeConfig, navigate]);

    // 1. Initial Identity & Config Fetch
    useEffect(() => {
        const initExam = async () => {
            setLoading(true);
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) {
                    console.error("Auth error:", authError);
                    navigate('/portal/student');
                    return;
                }

                // Fetch Student
                const { data: std, error: stdError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (stdError || !std) {
                    console.error("Student fetch error:", stdError);
                    navigate('/portal/student');
                    return;
                }
                setStudent(std);
                setStudentName(std.full_name || std.name || user.user_metadata?.full_name || user.email);

                const avatar = std.image_url || std.profile_image || std.profile_picture || std.avatar_url;
                if (avatar) setProfileImage(avatar);

                // Get System Settings early
                const { data: sData, error: sErr } = await supabase
                    .from('system_settings')
                    .select('current_session, current_term')
                    .maybeSingle();

                const curSession = sData?.current_session || '';
                const curTerm = sData?.current_term || '';
                if (!sErr && sData) setSessionInfo({ session: curSession, term: curTerm });

                let cfg = passedExamConfig;
                if (!cfg) {
                    console.log("No exam config passed from ActiveExam, fetching from database...");
                    const { data: activeExams, error: cfgError } = await supabase
                        .from('active_exams')
                        .select('*, exam_configs!inner(*, subjects(subject_name))')
                        .eq('exam_configs.class_id', std.class_id)
                        .eq('is_active', true)
                        .eq('session_id', curSession)
                        .eq('term_id', curTerm);

                    if (cfgError || !activeExams || activeExams.length === 0) {
                        setLoading(false);
                        navigate('/portal/student/no-exam');
                        return;
                    }

                    // Find available Exam by checking current term results & visibility time
                    const { data: results } = await supabase
                        .from('exam_results')
                        .select('subject_id, question_type')
                        .eq('student_id', std.id)
                        .eq('session_id', curSession)
                        .eq('term_id', curTerm);

                    const takenKeys = new Set(results?.map(r => `${r.subject_id}_${r.question_type}`) || []);
                    const availableAE = activeExams.find(ae => {
                        const cfgInner = ae.exam_configs;
                        const notTaken = !takenKeys.has(`${cfgInner.subject_id}_${cfgInner.question_type}`);
                        const isTimeReady = !ae.visible_at || new Date(ae.visible_at) <= new Date();
                        return notTaken && isTimeReady;
                    });

                    if (!availableAE) {
                        setLoading(false);
                        navigate('/portal/student/no-exam');
                        return;
                    }
                    cfg = {
                        ...availableAE.exam_configs,
                        visible_at: availableAE.visible_at,
                        active_exam_id: availableAE.id
                    };
                } else {
                    // If cfg passed from state, still check visibility time for security
                    const isTimeReady = !cfg.visible_at || new Date(cfg.visible_at) <= new Date();
                    if (!isTimeReady) {
                        setLoading(false);
                        navigate('/portal/student/no-exam');
                        return;
                    }
                }
                setActiveConfig(cfg);

                if (preloadedQuestions) {
                    setQuestions(preloadedQuestions);
                } else {
                    const { data: qData, error: qError } = await supabase
                        .from('questions')
                        .select('*')
                        .eq('class_id', std.class_id)
                        .eq('subject_id', cfg.subject_id)
                        .eq('question_type', cfg.question_type)
                        .eq('session_id', curSession)
                        .eq('term_id', curTerm);

                    if (qError) console.error("Questions fetch error:", qError);
                    if (!qData || qData.length === 0) {
                        alert("No questions found for this exam. Contact admin.");
                        setLoading(false);
                        navigate('/portal/student/no-exam');
                        return;
                    }

                    let processed = [...qData];
                    if (cfg.selection_type === 'random') {
                        processed = processed.sort(() => Math.random() - 0.5);
                    }
                    setQuestions(processed.slice(0, cfg.question_count || processed.length));
                }

                if (passedSessionInfo) setSessionInfo(passedSessionInfo);
                else {
                    if (!sErr && sData) setSessionInfo({ session: curSession, term: curTerm });
                }

                // 5. Restore Progress or Set Initial Timer from Server
                const storageKey = `exam_prog_${std.id}_${cfg.id}`;
                const savedStr = localStorage.getItem(storageKey);
                let loadedAnswers = {};
                let loadedIdx = 0;
                let remainingTime = (cfg.duration_minutes || 60) * 60;

                // Sync with Server Attempt
                const { data: attempt } = await supabase
                    .from('exam_attempts')
                    .select('end_time')
                    .eq('student_id', std.id)
                    .eq('exam_id', cfg.id)
                    .eq('status', 'started')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (attempt && attempt.end_time) {
                    const serverEndTime = new Date(attempt.end_time).getTime();
                    const diff = Math.floor((serverEndTime - Date.now()) / 1000);
                    remainingTime = diff > 0 ? diff : 0;

                    // If we have local storage, restore answers/index but keep server time
                    if (savedStr) {
                        try {
                            const saved = JSON.parse(savedStr);
                            if (saved.answers) loadedAnswers = saved.answers;
                            if (saved.currentQuestionIdx) loadedIdx = saved.currentQuestionIdx;
                        } catch (e) { console.error(e); }
                    } else {
                        // First time found on server but not local (perhaps cache cleared)
                        localStorage.setItem(storageKey, JSON.stringify({ endTime: serverEndTime, answers: {}, currentQuestionIdx: 0 }));
                    }
                } else {
                    // No server attempt found? The student shouldn't be here.
                    // But for resilience, we'll allow it and create one if ActiveExam missed it.
                    const endTime = Date.now() + (remainingTime * 1000);
                    localStorage.setItem(storageKey, JSON.stringify({ endTime, answers: {}, currentQuestionIdx: 0 }));
                }

                setAnswers(loadedAnswers);
                setCurrentQuestionIdx(loadedIdx);
                setTimeLeft(remainingTime);
                setLoading(false);
            } catch (error) {
                console.error("Error in initExam:", error);
                setLoading(false);
                alert("Error loading exam. Please try again.");
                navigate('/portal/student/no-exam');
            }
        };

        initExam();
    }, [navigate, passedExamConfig]);

    // 2. Timer Hook
    useEffect(() => {
        if (timeLeft === null || isSubmitting || submittingRef.current) return;

        if (timeLeft <= 0) {
            console.log("Time's up! Auto-submitting...");
            // Do NOT set submittingRef.current here, handleSubmit will do it!
            handleSubmit(true);
            return;
        }

        const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timeLeft, isSubmitting, handleSubmit]);

    // 3. Proactive Admin-Sync Check
    useEffect(() => {
        if (!student?.class_id || !activeConfig?.id || isSubmitting) return;

        const checkStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from('exam_configs')
                    .select('is_active')
                    .eq('id', activeConfig.id)
                    .maybeSingle();

                // ONLY redirect if we successfully queried AND specifically found it is no longer active
                if (!error && (data === null || data.is_active === false)) {
                    console.log("Exam deactivated by admin, redirecting...");
                    navigate('/portal/student/no-exam');
                }
            } catch (err) {
                console.warn("Status check failed (network?), retaining current screen.");
            }
        };

        // High-Concurrency Optimization: Randomized polling interval (20-30s) prevents all clients 
        // from hitting the server at the exact same millisecond.
        const interval = setInterval(checkStatus, 20000 + (Math.random() * 10000));
        return () => clearInterval(interval);
    }, [student, activeConfig, isSubmitting, navigate]);


    // Unified Shell
    const renderHeader = () => (
        <header className="portal-header-bar nes-header">
            <div className="nes-header-left">
                <img src={logo} alt="Logo" className="portal-logo-img" />
                <div>
                    <h1 className="portal-school-name" style={{ margin: 0 }}>Fad Maestro Academy</h1>
                    {activeConfig && (
                        <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 'bold' }}>
                            {activeConfig?.subjects?.subject_name} • {activeConfig?.question_type?.toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            <div className="nes-header-right">
                {activeConfig && timeLeft !== null && (
                    <div className="es-timer-box" style={{ marginRight: '15px', background: timeLeft < 60 ? '#fee2e2' : '#f3f4f6', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', lineHeight: 1 }}>TIME LEFT</span>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: timeLeft < 60 ? '#ef4444' : '#1f2937' }}>{formatTime(timeLeft)}</span>
                    </div>
                )}
                <span className="nes-user-name" style={{ marginRight: '13px' }}>{studentName}</span>
                <div className="nes-avatar" style={{ marginRight: '10px' }}>
                    {profileImage ? (
                        <img src={profileImage} alt="Profile" className="nes-profile-img" />
                    ) : (
                        <span style={{ color: '#4B5563', fontWeight: 'bold', fontSize: '16px' }}>
                            {studentName ? studentName.charAt(0).toUpperCase() : 'S'}
                        </span>
                    )}
                </div>
                {activeConfig && (
                    <button className="es-submit-btn" onClick={() => handleSubmit()} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                )}
            </div>
        </header>
    );

    if (loading && !activeConfig) {
        return (
            <div className="portal-login-container">
                {renderHeader()}
                <main className="portal-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="qe-spinner" style={{ width: '40px', height: '40px', borderTopColor: '#9D245A' }}></div>
                </main>
            </div>
        );
    }

    const currentQ = questions[currentQuestionIdx];
    const formatTime = (seconds) => {
        const totalSeconds = Math.max(0, seconds);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="portal-login-container">
            {renderHeader()}

            <main className="es-main">
                <div className="es-question-card">
                    <p className="es-question-counter">Question {currentQuestionIdx + 1} of {questions.length}</p>
                    <p className="es-question-text">{currentQ?.question_text}</p>

                    <div className="es-options">
                        {['a', 'b', 'c', 'd'].map((key) => (
                            <label key={key} className="es-option-label">
                                <input
                                    type="radio"
                                    name={`q${currentQ?.id}`}
                                    value={key.toUpperCase()}
                                    checked={answers[currentQ?.id] === key.toUpperCase()}
                                    onChange={() => handleAnswer(key.toUpperCase())}
                                    className="es-radio"
                                />
                                <span className="es-radio-custom" />
                                <span className="es-option-text">{currentQ?.[`option_${key}`]}</span>
                            </label>
                        ))}
                    </div>

                    <div className="es-nav-row">
                        <button
                            className="es-prev-btn"
                            onClick={() => navToQuestion(currentQuestionIdx - 1)}
                            disabled={currentQuestionIdx === 0 || isSubmitting}
                        >
                            Previous
                        </button>
                        {currentQuestionIdx === questions.length - 1 ? (
                            <button
                                className="es-next-btn es-finish-btn"
                                style={{ background: '#16a34a' }}
                                onClick={() => handleSubmit(false)}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Finish & Submit'}
                            </button>
                        ) : (
                            <button
                                className="es-next-btn"
                                onClick={() => navToQuestion(currentQuestionIdx + 1)}
                                disabled={isSubmitting}
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>

                <div className="es-grid-card">
                    <div className="es-number-grid">
                        {questions.map((q, i) => (
                            <button
                                key={q.id}
                                className={`es-num-btn ${i === currentQuestionIdx ? 'es-num-current' : ''} ${answers[q.id] ? 'es-num-answered' : ''}`}
                                onClick={() => navToQuestion(i)}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ExamScreen;
