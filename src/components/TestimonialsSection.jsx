import React from 'react';
import { Link } from 'react-router-dom';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import './TestimonialsSection.css';

const TestimonialsSection = () => {
    const testimonials = [
        {
            id: 1,
            text: "The nurturing environment at Fad Maestro is unparalleled. I watched my daughter transform from a shy toddler into a confident primary pupil who reads with such clarity and poise. It's truly a second home for our children.",
            name: "Mrs. O. Adeyemi",
            role: "Parent, Primary 4"
        },
        {
            id: 2,
            text: "As an educator, I'm very particular about foundations. My son's transition from nursery to primary here was seamless. The depth of the curriculum and the dedication of the teachers in these formative years is what sets Fad Maestro apart.",
            name: "Prof. Fidelis Allen",
            role: "Parent & Academic"
        },
        {
            id: 3,
            text: "The moral seeds sown in me during my years at Fad Maestro Primary are what guide my decisions today as a medical student. They don't just teach subjects; they build character and integrity from the very first day of school.",
            name: "Peniel Eichie",
            role: "Alumni, Medical Student"
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
