import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ChevronDown, ChevronUp, Search, MessageCircleQuestion } from 'lucide-react';
import './FAQPage.css';

const FAQPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [openIndex, setOpenIndex] = useState(0);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const faqs = [
        {
            question: "When does the admission process for the new academic session begin?",
            answer: "The admission process typically begins in March for the September intake. We also have a mid-term intake in January depending on vacancy availability."
        },
        {
            question: "What are the age requirements for Nursery and Primary sections?",
            answer: "For Nursery 1, children should be at least 3 years old by September. For Primary 1, children should be 6 years old by September."
        },
        {
            question: "What documents are required for the application?",
            answer: "You will need a scanned copy of the child's birth certificate, recent passport photographs, immunization records, and the most recent academic report from their previous school (where applicable)."
        },
        {
            question: "Is there an entrance examination for new students?",
            answer: "Yes, candidates for Primary 1-6 and Secondary sections are required to take a placement test in English, Mathematics, and General Paper to ensure they are placed in the appropriate grade level."
        },
        {
            question: "How can I track the status of my child's application?",
            answer: "Once you create an account on our Admission Portal, you can log in at any time to see the current status of your application, from 'Submitted' to 'Interview Scheduled' and finally 'Admission Offered'."
        },
        {
            question: "Do you offer school bus services?",
            answer: "Yes, we provide safe and reliable transportation services across several designated routes. Details and fees for the school bus service can be obtained at the administrative office."
        }
    ];

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="faq-page">
            <Header />

            <section className="faq-hero">
                <div className="container">
                    <MessageCircleQuestion className="hero-icon" size={48} />
                    <h1>Frequently Asked Questions</h1>
                    <p>Find answers to common questions about admissions and school life at Fad Maestro Academy.</p>
                </div>
            </section>

            <main className="faq-content">
                <div className="container">
                    <div className="search-wrapper">
                        <div className="search-bar">
                            <Search size={20} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search for questions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="faq-accordion-container">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className={`faq-item ${openIndex === index ? 'open' : ''}`}
                                >
                                    <button
                                        className="faq-question"
                                        onClick={() => toggleAccordion(index)}
                                    >
                                        <span>{faq.question}</span>
                                        {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                    <div className="faq-answer">
                                        <div className="faq-answer-inner">
                                            {faq.answer}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">
                                <p>No questions found matching your search. Please try a different keyword or contact us directly.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default FAQPage;
