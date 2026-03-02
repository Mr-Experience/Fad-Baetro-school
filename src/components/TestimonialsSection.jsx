import React from 'react';
import { Link } from 'react-router-dom';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import './TestimonialsSection.css';

const TestimonialsSection = () => {
    const testimonials = [
        {
            id: 1,
            text: "My friend spoke so well about Fad Maestro. Being a teacher for over 27 years, I was curious and brought my son here. His performance gives me an assurance that you are really doing a good job here.",
            name: "Prof. Fidelis Allen",
            role: "Parent, Fad Maestro PH"
        },
        {
            id: 2,
            text: "Fad Maestro helped a great deal in shaping my life and giving me a good career path Truly Fad Maestro Nursery & Primary School is committed to raising exceptional Leaders.",
            name: "Eichie Peniel Alumni",
            role: "Alumni"
        },
        {
            id: 3,
            text: "As a Civil Engineering undergraduate, my student life and academic performance in the university is great because of the firm foundation given to me in Fad Maestro.",
            name: "Akinseye Segun",
            role: "Alumni"
        }
    ];

    return (
        <section className="testimonials-section">
            <div className="testimonials-overlay"></div>
            <div className="testimonials-container">
                <span className="testimonials-subtitle">TESTIMONIALS</span>
                <h2 className="testimonials-title">
                    Hear what <span className="highlight-text">Everyone</span> <br />
                    has to say about Fad Maestro
                </h2>

                <div className="testimonials-slider-container">
                    <button className="testimonials-nav-btn prev">
                        <ChevronLeft size={24} />
                    </button>

                    <div className="testimonials-grid">
                        {testimonials.map((item) => (
                            <div key={item.id} className="testimonial-card">
                                <div className="quote-icon-wrapper">
                                    <Quote size={40} className="quote-icon" />
                                </div>
                                <p className="testimonial-text">{item.text}</p>
                                <div className="testimonial-footer">
                                    <div className="testimonial-divider"></div>
                                    <h4 className="testimonial-name">{item.name}</h4>
                                    <span className="testimonial-role">{item.role}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="testimonials-nav-btn next">
                        <ChevronRight size={24} />
                    </button>
                </div>

                <div className="testimonials-actions">
                    <Link to="/about" className="testimonials-view-more">
                        View More Testimonials
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
