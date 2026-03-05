import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import './ExamScreen.css';
import logo from '../../assets/logo.jpg';

const TOTAL_QUESTIONS = 60;

const sampleQuestions = [
    { id: 1, text: 'The ultimate ?', options: ['Nova', 'The Ultimate', 'The Birds', 'Skippa'] },
    { id: 2, text: 'Which of the following is a vowel?', options: ['B', 'C', 'A', 'D'] },
    { id: 3, text: 'What is the plural of "child"?', options: ['Childs', 'Childes', 'Children', 'Childrens'] },
    { id: 4, text: 'Choose the correct spelling:', options: ['Recieve', 'Receive', 'Receve', 'Recive'] },
    { id: 5, text: 'Which is a noun?', options: ['Run', 'Quickly', 'Beautiful', 'Table'] },
];

const ExamScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const passedExamConfig = location.state?.examConfig;

    // Identity & Config
    const [student, setStudent] = useState(null);
    const [activeConfig, setActiveConfig] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [profileImage, setProfileImage] = useState(null);
    const [sessionInfo, setSessionInfo] = useState({ session: '', term: '' });

    // Exam State
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState({}); // { question_id: 'A' }
    const [timeLeft, setTimeLeft] = useState(null); // in seconds
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

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
                    .from('students')
                    .select('*')
                    .eq('email', user.email.toLowerCase())
                    .maybeSingle();

                if (stdError || !std) { 
                    console.error("Student fetch error:", stdError);
                    navigate('/portal/student'); 
                    return; 
                }
                setStudent(std);

                // Extract profile image from database
                if (std.profile_image) {
                    setProfileImage(std.profile_image);
                } else if (std.profile_picture) {
                    setProfileImage(std.profile_picture);
                } else if (std.avatar_url) {
                    setProfileImage(std.avatar_url);
                }

                // Use passed exam config or fetch it
                let cfg = passedExamConfig;
                if (!cfg) {
                    console.log("No exam config passed from ActiveExam, fetching from database...");
                    const { data: fetchedCfg, error: cfgError } = await supabase
                        .from('exam_configs')
                        .select('*, subjects(subject_name)')
                        .eq('class_id', std.class_id)
                        .eq('is_active', true)
                        .maybeSingle();

                    if (cfgError || !fetchedCfg) { 
                        console.error("Exam config fetch error:", cfgError);
                        navigate('/portal/student/no-exam'); 
                        return; 
                    }
                    cfg = fetchedCfg;
                } else {
                    console.log("✅ Using exam config passed from ActiveExam screen");
                }
                setActiveConfig(cfg);

                // Fetch Questions
                console.log("📝 Fetching questions:", { 
                    class_id: std.class_id, 
                    subject_id: cfg.subject_id, 
                    question_type: cfg.question_type 
                });
                
                const { data: qData, error: qError } = await supabase
                    .from('questions')
                    .select('*')
                    .eq('class_id', std.class_id)
                    .eq('subject_id', cfg.subject_id)
                    .eq('question_type', cfg.question_type);

                if (qError) {
                    console.error("Questions fetch error:", qError);
                }

                if (!qData || qData.length === 0) {
                    alert("No questions found for this exam. Contact admin.");
                    navigate('/portal/student/no-exam');
                    return;
                }

                console.log(`✅ Loaded ${qData.length} questions`);

                // Fetch Session Info
                const { data: sessionData } = await supabase
                    .from('system_settings')
                    .select('current_session, current_term')
                    .single();

                if (sessionData) {
                    setSessionInfo({
                        session: sessionData.current_session || '',
                        term: sessionData.current_term || ''
                    });
                }

                // Shuffle and Limit
                let processed = [...qData];
                if (cfg.selection_type === 'random') {
                    processed = processed.sort(() => Math.random() - 0.5);
                }
                const count = cfg.question_count || processed.length;
                setQuestions(processed.slice(0, count));

                // Set Timer (from duration_minutes)
                setTimeLeft((cfg.duration_minutes || 60) * 60);
                setLoading(false);
            } catch (error) {
                console.error("Error in initExam:", error);
                alert("Error loading exam. Please try again.");
                navigate('/portal/student/no-exam');
            }
        };

        initExam();
    }, [navigate, passedExamConfig]);

    // 2. Timer Hook
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || isSubmitting) {
            if (timeLeft === 0 && !isSubmitting) handleSubmit();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, isSubmitting]);

    // 3. Proactive Admin-Sync Check
    useEffect(() => {
        if (!student?.class_id || isSubmitting) return;

        const checkStatus = async () => {
            const { data: active } = await supabase
                .from('exam_configs')
                .select('id')
                .eq('class_id', student.class_id)
                .eq('is_active', true)
                .limit(1);

            if (!active || active.length === 0) {
                navigate('/portal/student/no-exam');
            }
        };

        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [student, isSubmitting, navigate]);

    // --- ACTIONS ---
    const handleAnswer = (option) => {
        const q = questions[currentQuestionIdx];
        setAnswers(prev => ({ ...prev, [q.id]: option }));
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        if (timeLeft > 0 && !window.confirm("Are you sure you want to submit your exam now?")) return;

        setIsSubmitting(true);

        try {
            // Calculate Score
            let correctCount = 0;
            questions.forEach(q => {
                const studentAns = answers[q.id];
                if (studentAns && studentAns.toUpperCase() === q.correct_answer?.toUpperCase()) {
                    correctCount++;
                }
            });

            const scorePercent = ((correctCount / questions.length) * 100).toFixed(1);

            // Fetch class and subject names
            const { data: classData } = await supabase
                .from('classes')
                .select('name')
                .eq('id', student.class_id)
                .single();

            const { data: subjectData } = await supabase
                .from('subjects')
                .select('name')
                .eq('id', activeConfig.subject_id)
                .single();

            // Save to Results with full metadata
            const { error } = await supabase
                .from('exam_results')
                .insert({
                    student_id: student.id,
                    class_id: student.class_id,
                    subject_id: activeConfig.subject_id,
                    question_type: activeConfig.question_type,
                    total_questions: questions.length,
                    correct_answers: correctCount,
                    score_percent: scorePercent,
                    answers_json: answers,
                    completed_at: new Date().toISOString(),
                    session_id: sessionInfo.session,
                    term_id: sessionInfo.term,
                    class_name: classData?.name || '',
                    subject_name: subjectData?.name || ''
                });

            if (error) {
                console.error("Save Error:", error);
                // Even if save fails to results, try to navigate so student doesn't sit in loop
            }

            navigate('/portal/student/submitted', { state: { score: scorePercent, name: student.full_name } });

        } catch (err) {
            console.error("Submission crash:", err);
            alert("An error occurred during submission. Please contact your supervisor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="portal-login-container" style={{ justifyContent: 'center', color: '#9D245A', fontWeight: 'bold' }}>Preparing your exam...</div>;

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
                        <h1 className="portal-school-name" style={{ margin: 0 }}>Fad Mastro Academy</h1>
                        <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 'bold' }}>{activeConfig?.subjects?.subject_name} • {activeConfig?.question_type?.toUpperCase()}</span>
                    </div>
                </div>

                <div className="nes-header-right">
                    <div className="es-timer-box" style={{ marginRight: '15px', background: timeLeft < 60 ? '#fee2e2' : '#f3f4f6', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', lineHeight: 1 }}>TIME LEFT</span>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: timeLeft < 60 ? '#ef4444' : '#1f2937' }}>{formatTime(timeLeft)}</span>
                    </div>
                    <span className="nes-user-name" style={{ marginRight: '10px' }}>{student?.full_name}</span>
                    <div className="nes-avatar" style={{ marginRight: '10px' }}>
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="nes-profile-img" />
                        ) : (
                            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
                                <circle cx="18" cy="18" r="18" fill="#D1D5DB" />
                                <circle cx="18" cy="14" r="6" fill="#9CA3AF" />
                                <ellipse cx="18" cy="30" rx="10" ry="7" fill="#9CA3AF" />
                            </svg>
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
                        <button className="es-prev-btn" onClick={() => setCurrentQuestionIdx(i => i - 1)} disabled={currentQuestionIdx === 0}>Previous</button>
                        {currentQuestionIdx === questions.length - 1 ? (
                            <button className="es-next-btn" onClick={handleSubmit} style={{ background: '#10b981' }}>Finish</button>
                        ) : (
                            <button className="es-next-btn" onClick={() => setCurrentQuestionIdx(i => i + 1)}>Next</button>
                        )}
                    </div>
                </div>

                <div className="es-grid-card">
                    <div className="es-number-grid">
                        {questions.map((q, i) => (
                            <button
                                key={q.id}
                                className={`es-num-btn ${i === currentQuestionIdx ? 'es-num-current' : ''} ${answers[q.id] ? 'es-num-answered' : ''}`}
                                onClick={() => setCurrentQuestionIdx(i)}
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
