import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../auth/PortalLogin.css';
import './NoExamSchedule.css';
import './ExamScreen.css';
import logo from '../../assets/logo.jpg';

const ExamScreen = () => {
    const navigate = useNavigate();

    // Identity & Config
    const [candidate, setCandidate] = useState(null);
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
            }

            // Fetch Active Candidate Config
            const { data: cfg } = await supabase
                .from('exam_configs')
                .select('*, subjects(subject_name)')
                .eq('class_id', std?.class_id || '')
                .eq('question_type', 'candidate')
                .eq('is_active', true)
                .maybeSingle();

            if (!cfg) { navigate('/portal/candidate/no-exam'); return; }
            setActiveConfig(cfg);

            // Fetch Questions
            const { data: qData } = await supabase
                .from('questions')
                .select('*')
                .eq('class_id', cfg.class_id)
                .eq('subject_id', cfg.subject_id)
                .eq('question_type', 'candidate');

            if (!qData || qData.length === 0) {
                alert("No questions found for this exam. Contact admin.");
                navigate('/portal/candidate/no-exam');
                return;
            }

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

            // Set Timer
            setTimeLeft((cfg.duration_minutes || 60) * 60);
            setLoading(false);
        };

        initExam();
    }, [navigate]);

    // Timer Hook
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || isSubmitting) {
            if (timeLeft === 0 && !isSubmitting) handleSubmit();
            return;
        }
        const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timeLeft, isSubmitting]);

    const handleAnswer = (option) => {
        const q = questions[currentQuestionIdx];
        setAnswers(prev => ({ ...prev, [q.id]: option }));
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        if (timeLeft > 0 && !window.confirm("Submit your exam now?")) return;

        setIsSubmitting(true);
        try {
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
                .eq('id', activeConfig.class_id)
                .single();

            const { data: subjectData } = await supabase
                .from('subjects')
                .select('name')
                .eq('id', activeConfig.subject_id)
                .single();

            // Save with full metadata
            await supabase
                .from('exam_results')
                .insert({
                    student_id: candidate.id,
                    class_id: activeConfig.class_id,
                    subject_id: activeConfig.subject_id,
                    question_type: 'candidate',
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

            navigate('/portal/candidate/submitted', { state: { score: scorePercent, name: candidate.full_name } });
        } catch (err) {
            console.error("Submission crash:", err);
            alert("Error submitting exam. Please notify your supervisor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="portal-login-container" style={{ justifyContent: 'center', color: '#9D245A', fontWeight: 'bold' }}>Preparing entrance exam...</div>;

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
