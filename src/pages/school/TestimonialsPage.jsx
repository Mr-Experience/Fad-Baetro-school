import React, { useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TestimonialsSection from '../../components/TestimonialsSection';
import './TestimonialsPage.css';

const TestimonialsPage = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="testimonials-page">
            <Header />

            <div className="page-header-simple">
                <div className="container">
                    <h1>Parents & Alumni Testimonials</h1>
                    <p>Hear from those who have experienced the Fad Maestro excellence.</p>
                </div>
            </div>

            <main className="testimonials-main">
                <TestimonialsSection />
            </main>

            <Footer />
        </div>
    );
};

export default TestimonialsPage;
