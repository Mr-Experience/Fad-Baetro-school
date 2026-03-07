import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
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
    const [candidate, setCandidate] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [activeConfig, setActiveConfig] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [sessionInfo, setSessionInfo] = useState({ session: '', term: '' });

    // Exam State
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initExam = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { navigate('/portal/candidate'); return; }

                // Fetch Candidate Identity
                const { data: std } = await supabase
                    .from('students')
                    .select('*')
                    .eq('email', user.email.toLowerCase())
                    .maybeSingle();

                if (!std) {
                    setCandidate({ full_name: user.email, id: user.id });
                } else {
                    setCandidate(std);
                    setProfileImage(std.image_url || std.profile_image || std.profile_picture || std.avatar_url || null);
                }

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
                    const { data: activeConfigs, error: cfgError } = await supabase
                        .from('exam_configs')
                        .select('*, subjects(subject_name)')
                        .eq('class_id', std?.class_id || '')
                        .eq('question_type', 'candidate')
                        .eq('is_active', true);

                    if (cfgError || !activeConfigs || activeConfigs.length === 0) {
                        setLoading(false);
                        navigate('/portal/candidate/no-exam');
                        return;
                    }

                    const { data: results } = await supabase
                        .from('exam_results')
                        .select('subject_id')
                        .eq('student_id', std?.id || user.id)
                        .eq('session_id', curSession)
                        .eq('term_id', curTerm)
                        .eq('question_type', 'candidate');

                    const takenSubjects = new Set(results?.map(r => r.subject_id) || []);
                    cfg = activeConfigs.find(c => {
                        const notTaken = !takenSubjects.has(c.subject_id);
                        const isTimeReady = !c.visible_at || new Date(c.visible_at) <= new Date();
                        return notTaken && isTimeReady;
                    });

                    if (!cfg) {
                        setLoading(false);
                        navigate('/portal/candidate/no-exam');
                        return;
                    }
                } else {
                    // Check time even if passed from state
                    const isTimeReady = !cfg.visible_at || new Date(cfg.visible_at) <= new Date();
                    if (!isTimeReady) {
                        setLoading(false);
                        navigate('/portal/candidate/no-exam');
                        return;
                    }
                }
                setActiveConfig(cfg);

                if (preloadedQuestions) {
                    setQuestions(preloadedQuestions);
                } else {
                    const { data: qData } = await supabase
                        .from('questions')
                        .select('*')
                        .eq('class_id', cfg.class_id)
                        .eq('subject_id', cfg.subject_id)
                        .eq('question_type', 'candidate')
                        .eq('session_id', curSession)
                        .eq('term_id', curTerm);

                    if (!qData || qData.length === 0) {
                        alert("No questions found for this exam. Contact admin.");
                        setLoading(false);
                        navigate('/portal/candidate/no-exam');
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
                const storageKey = `exam_prog_cand_${user.id}_${cfg.id}`;
                const savedStr = localStorage.getItem(storageKey);
                let loadedAnswers = {};
                let loadedIdx = 0;
                let remainingTime = (cfg.duration_minutes || 60) * 60;

                // Sync with Server Attempt
                const { data: attempt } = await supabase
                    .from('exam_attempts')
                    .select('end_time')
                    .eq('student_id', std?.id || user.id)
                    .eq('exam_id', cfg.id)
                    .eq('status', 'started')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (attempt && attempt.end_time) {
                    const serverEndTime = new Date(attempt.end_time).getTime();
                    const diff = Math.floor((serverEndTime - Date.now()) / 1000);
                    remainingTime = diff > 0 ? diff : 0;

                    // Restore content from storage but favor server time
                    if (savedStr) {
                        try {
                            const saved = JSON.parse(savedStr);
                            if (saved.answers) loadedAnswers = saved.answers;
                            if (saved.currentQuestionIdx) loadedIdx = saved.currentQuestionIdx;
                        } catch (e) { console.error(e); }
                    } else {
                        localStorage.setItem(storageKey, JSON.stringify({ endTime: serverEndTime, answers: {}, currentQuestionIdx: 0 }));
                    }
                } else {
                    const endTime = Date.now() + (remainingTime * 1000);
                    localStorage.setItem(storageKey, JSON.stringify({ endTime, answers: {}, currentQuestionIdx: 0 }));
                }

                setAnswers(loadedAnswers);
                setCurrentQuestionIdx(loadedIdx);
                setTimeLeft(remainingTime);
                setLoading(false);
            } catch (e) {
                console.error("Crash during init:", e);
                setLoading(false);
                navigate('/portal/candidate');
            }
        };

        initExam();
    }, [navigate]);

    // Timer Hook
    useEffect(() => {
        if (timeLeft === null || isSubmitting) return;

        if (timeLeft <= 0) {
            console.log("Time's up! Auto-submitting...");
            handleSubmit(true);
            return;
        }

        const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timeLeft, isSubmitting]);

    // Admin-Sync Check (Candidate)
    useEffect(() => {
        if (!candidate?.id || !activeConfig?.id || isSubmitting) return;

        const checkStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from('exam_configs')
                    .select('is_active')
                    .eq('id', activeConfig.id)
                    .maybeSingle();

                if (!error && (data === null || data.is_active === false)) {
                    console.log("Exam deactivated, redirecting...");
                    navigate('/portal/candidate/no-exam');
                }
            } catch (err) {
                console.warn("Status check failed.");
            }
        };

        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [candidate, activeConfig, isSubmitting, navigate]);

    const handleAnswer = (option) => {
        const q = questions[currentQuestionIdx];
        const newAnswers = { ...answers, [q.id]: option };
        setAnswers(newAnswers);

        // Save to LocalStorage
        if (candidate && activeConfig) {
            const storageKey = `exam_prog_cand_${candidate.id}_${activeConfig.id}`;
            const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
            localStorage.setItem(storageKey, JSON.stringify({ ...existing, answers: newAnswers }));
        }
    };

    const navToQuestion = (idx) => {
        setCurrentQuestionIdx(idx);
        if (candidate && activeConfig) {
            const storageKey = `exam_prog_cand_${candidate.id}_${activeConfig.id}`;
            const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
            localStorage.setItem(storageKey, JSON.stringify({ ...existing, currentQuestionIdx: idx }));
        }
    };

    const handleSubmit = async (skipConfirm = false) => {
        if (isSubmitting) return;
        if (!skipConfirm && timeLeft > 0 && !window.confirm("Submit your exam now?")) return;

        setIsSubmitting(true);
        try {
            let correctCount = 0;
            const totalQ = questions.length || 1;
            questions.forEach(q => {
                const studentAns = answers[q.id];
                if (studentAns && studentAns.toUpperCase() === q.correct_answer?.toUpperCase()) {
                    correctCount++;
                }
            });

            const scorePercent = ((correctCount / totalQ) * 100).toFixed(1);

            // Fetch metadata
            let className = '';
            let subjectName = '';
            try {
                const [{ data: cData }, { data: sData }] = await Promise.all([
                    supabase.from('classes').select('class_name').eq('id', activeConfig.class_id).maybeSingle(),
                    supabase.from('subjects').select('subject_name').eq('id', activeConfig.subject_id).maybeSingle()
                ]);
                className = cData?.class_name || '';
                subjectName = sData?.subject_name || '';
            } catch (metaErr) {
                console.warn("Meta fetch error:", metaErr);
            }

            // Save with full metadata
            const { error: insertError } = await supabase
                .from('exam_results')
                .insert({
                    student_id: candidate.id,
                    exam_id: activeConfig.id,
                    class_id: activeConfig.class_id,
                    subject_id: activeConfig.subject_id,
                    question_type: 'candidate',
                    total_questions: questions.length,
                    correct_answers: correctCount,
                    score_percent: scorePercent,
                    answers_json: answers,
                    submitted_at: new Date().toISOString(),
                    session_id: sessionInfo.session,
                    term_id: sessionInfo.term,
                    class_name: className,
                    subject_name: subjectName
                });

            if (insertError) {
                if (insertError.code === '23505') {
                    console.log("Duplicate result detected.");
                } else {
                    throw insertError;
                }
            }

            // Update local attempt status
            await supabase
                .from('exam_attempts')
                .update({ status: 'completed' })
                .eq('student_id', candidate.id)
                .eq('exam_id', activeConfig.id);

            // Clear progress
            localStorage.removeItem(`exam_prog_cand_${candidate.id}_${activeConfig.id}`);

            // Redirect
            navigate('/portal/candidate/submitted', {
                state: { score: scorePercent, name: candidate.full_name },
                replace: true
            });
        } catch (err) {
            console.error("Submission Error:", err);
            alert("Error during submission. Progress saved locally.");
        } finally {
            setIsSubmitting(false);
        }
    };

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

    const currentQ = questions[currentQuestionIdx];
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="portal-login-container">
            <header className="portal-header-bar nes-header">
                <div className="nes-header-left">
                    <img src={logo} alt="Logo" className="portal-logo-img" />
                    <div>
                        <h1 className="portal-school-name" style={{ margin: 0 }}>Candidate Portal</h1>
                        <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 'bold' }}>{activeConfig?.subjects?.subject_name} • ENTRANCE EXAM</span>
                    </div>
                </div>

                <div className="nes-header-right">
                    <div className="es-timer-box" style={{ marginRight: '15px' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', lineHeight: 1 }}>TIME LEFT</span>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: timeLeft < 60 ? '#ef4444' : '#1f2937' }}>{formatTime(timeLeft)}</span>
                    </div>
                    <span className="nes-user-name" style={{ marginRight: '10px' }}>{candidate?.full_name}</span>
                    <div className="nes-avatar" style={{ marginRight: '10px' }}>
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="nes-profile-img" />
                        ) : (
                            <span style={{ color: '#4B5563', fontWeight: 'bold', fontSize: '16px' }}>
                                {candidate?.full_name ? candidate.full_name.charAt(0).toUpperCase() : 'C'}
                            </span>
                        )}
                    </div>
                    <button className="es-submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                </div>
            </header>

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
                                className="es-next-btn es-finish-stub"
                                style={{ background: '#9ca3af', cursor: 'default' }}
                                disabled={true}
                            >
                                Last Question
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
