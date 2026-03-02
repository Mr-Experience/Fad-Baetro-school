import React, { useState } from 'react';
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
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});

    const question = sampleQuestions[currentQuestion] || sampleQuestions[0];
    const questionNumber = currentQuestion + 1;
    const selectedAnswer = answers[question.id];

    const handleAnswer = (option) => {
        setAnswers(prev => ({ ...prev, [question.id]: option }));
    };

    const handlePrev = () => { if (currentQuestion > 0) setCurrentQuestion(c => c - 1); };
    const handleNext = () => { if (currentQuestion < sampleQuestions.length - 1) setCurrentQuestion(c => c + 1); };

    const isAnswered = (qIdx) => {
        const q = sampleQuestions[qIdx];
        return q && answers[q.id] !== undefined;
    };

    return (
        <div className="portal-login-container">
            {/* Header */}
            <header className="portal-header-bar nes-header">
                <div className="nes-header-left">
                    <img src={logo} alt="Logo" className="portal-logo-img" />
                    <h1 className="portal-school-name">Fad Mastro Academy</h1>
                </div>
                <div className="nes-header-right">
                    <span className="nes-user-name">Olajire Daniel</span>
                    <div className="nes-avatar">
                        <svg viewBox="0 0 36 36" fill="none" width="36" height="36">
                            <circle cx="18" cy="18" r="18" fill="#D1D5DB" />
                            <circle cx="18" cy="14" r="6" fill="#9CA3AF" />
                            <ellipse cx="18" cy="30" rx="10" ry="7" fill="#9CA3AF" />
                        </svg>
                    </div>
                    <button className="es-submit-btn">Submit Exam</button>
                </div>
            </header>

            {/* Main two-column layout */}
            <main className="es-main">
                {/* Left — Question card */}
                <div className="es-question-card">
                    <p className="es-question-counter">Question {questionNumber} of {TOTAL_QUESTIONS}</p>
                    <p className="es-question-text">{question.text}</p>

                    <div className="es-options">
                        {question.options.map((option) => (
                            <label key={option} className="es-option-label">
                                <input
                                    type="radio"
                                    name={`q${question.id}`}
                                    value={option}
                                    checked={selectedAnswer === option}
                                    onChange={() => handleAnswer(option)}
                                    className="es-radio"
                                />
                                <span className="es-radio-custom" />
                                <span className="es-option-text">{option}</span>
                            </label>
                        ))}
                    </div>

                    <div className="es-nav-row">
                        <button
                            className="es-prev-btn"
                            onClick={handlePrev}
                            disabled={currentQuestion === 0}
                        >
                            Previous
                        </button>
                        <button
                            className="es-next-btn"
                            onClick={handleNext}
                            disabled={currentQuestion === sampleQuestions.length - 1}
                        >
                            Next
                        </button>
                    </div>
                </div>

                {/* Right — Question number grid */}
                <div className="es-grid-card">
                    <div className="es-number-grid">
                        {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => (
                            <button
                                key={i + 1}
                                className={`es-num-btn ${i === currentQuestion ? 'es-num-current' : ''} ${isAnswered(i) && i !== currentQuestion ? 'es-num-answered' : ''}`}
                                onClick={() => i < sampleQuestions.length && setCurrentQuestion(i)}
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
