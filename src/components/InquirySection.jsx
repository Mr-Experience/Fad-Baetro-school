import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import './InquirySection.css';

const InquirySection = () => {
    return (
        <section className="inquiry-section">
            <div className="inquiry-overlay"></div>
            <div className="inquiry-container">
                <div className="inquiry-header">
                    <h2 className="inquiry-title">Have any questions?</h2>
                    <p className="inquiry-subtitle">
                        We are here to help, ask us any questions and we will respond right back to you.
                    </p>
                </div>

                <div className="inquiry-card-container">
                    <div className="inquiry-card">
                        <div className="inquiry-icon-wrapper">
                            <Users size={48} color="#1a365d" />
                        </div>
                        <h3 className="inquiry-card-title">Parent Support</h3>
                        <p className="inquiry-card-text">Let us know how we can help you</p>
                        <Link to="/contact" className="inquiry-btn">
                            Ask Questions
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InquirySection;
