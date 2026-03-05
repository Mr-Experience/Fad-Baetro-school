import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

    // Identity & Config
    const [student, setStudent] = useState(null);
    const [activeConfig, setActiveConfig] = useState(null);
    const [questions, setQuestions] = useState([]);

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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/portal/student'); return; }

            // Fetch Student
            const { data: std } = await supabase
                .from('students')
                .select('*')
                .eq('email', user.email.toLowerCase())
                .maybeSingle();

            if (!std) { navigate('/portal/student'); return; }
            setStudent(std);

            // Fetch Active Config
            const { data: cfg } = await supabase
                .from('exam_configs')
                .select('*, subjects(subject_name)')
                .eq('class_id', std.class_id)
                .eq('is_active', true)
                .maybeSingle();

            if (!cfg) { navigate('/portal/student/no-exam'); return; }
            setActiveConfig(cfg);

            // Fetch Questions
            const { data: qData } = await supabase
                .from('questions')
                .select('*')
                .eq('class_id', std.class_id)
                .eq('subject_id', cfg.subject_id)
                .eq('question_type', cfg.question_type);

            if (!qData || qData.length === 0) {
                alert("No questions found for this exam. Contact admin.");
                navigate('/portal/student/no-exam');
                return;
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
        };

        initExam();
    }, [navigate]);

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

            // Save to Results
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
                    completed_at: new Date().toISOString()
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
