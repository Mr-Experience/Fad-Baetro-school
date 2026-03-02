import React, { useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './AboutPage.css'; // Reusing styles
import { ArrowDown } from 'lucide-react';
import heroBg from '../../assets/images/school_group_red.jpg'; // Updated hero image

const VisionPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const scrollToContent = () => {
        const contentSection = document.getElementById('content-section');
        if (contentSection) {
            contentSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="about-page">
            <Header />

            {/* Hero Section */}
            <section
                className="about-hero"
                style={{ backgroundImage: `url(${heroBg})` }}
            >
                <div className="about-hero-content">
                    <span className="about-kicker">Our Purpose</span>
                    <h1 className="about-title">Vision &<br />Mission</h1>
                    <p className="about-description">
                        Guided by clear principles to transform our nation by producing upright leaders of the future through high quality and sound education.
                    </p>
                </div>

                <div className="scroll-indicator" onClick={scrollToContent}>
                    <div className="scroll-arrow-circle">
                        <ArrowDown size={24} color="currentColor" />
                    </div>
                </div>
            </section>

            {/* Philosophy Section */}
            <section id="content-section" className="about-section">
                <div className="section-box">
                    <div className="section-header">
                        <span className="section-subtitle">Core Values</span>
                        <div className="separator-container">
                            <div className="separator-line"></div>
                            <span className="separator-text">OF</span>
                            <div className="separator-line"></div>
                        </div>
                        <h2 className="section-title">The Philosophy</h2>
                    </div>
                    <div className="section-content">
                        <p>
                            The school is committed to providing the highest academic standard, cultivating sound leadership skills and vision, as well as enriching lives through spiritual development. This aims at raising upright future leaders through the ideals and values of practical morality and excellence.
                        </p>
                        <p>
                            Consequently, the school has zero tolerance for any act of indiscipline. In Fad Maestro School, there is no room for students to display affluence; the idea aims at giving a sense of equality to all students, fostering an environment where merit and character are the true measures of success.
                        </p>
                    </div>
                </div>
            </section>

            {/* Vision Statement */}
            <section className="about-section white-bg">
                <div className="section-box">
                    <div className="section-header">
                        <span className="section-subtitle">Our Goal</span>
                        <div className="separator-container">
                            <div className="separator-line"></div>
                            <span className="separator-text">OF</span>
                            <div className="separator-line"></div>
                        </div>
                        <h2 className="section-title">Vision Statement</h2>
                    </div>
                    <div className="section-content" style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#333' }}>
                            "To transform our nation by producing upright leaders of the future through high quality and sound education."
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission Statement */}
            <section className="about-section">
                <div className="section-box">
                    <div className="section-header">
                        <span className="section-subtitle">Our Promise</span>
                        <div className="separator-container">
                            <div className="separator-line"></div>
                            <span className="separator-text">OF</span>
                            <div className="separator-line"></div>
                        </div>
                        <h2 className="section-title">Mission Statement</h2>
                    </div>
                    <div className="section-content" style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#333' }}>
                            "To produce students who are academically well-grounded, morally upright and adequately equipped as future leaders."
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default VisionPage;
