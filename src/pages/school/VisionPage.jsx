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
                        Nurturing generations of academically excellent and self-reliant youth, dedicated to the values of integrity and moral uprightness.
                    </p>
                </div>

                <div className="scroll-indicator" onClick={scrollToContent}>
                    <div className="scroll-arrow-circle">
                        <ArrowDown size={24} color="currentColor" />
                    </div>
                </div>
            </section>

            {/* Consolidated Vision & Mission Section */}
            <section id="content-section" className="about-section">
                <div className="section-box">
                    <div className="section-header">
                        <span className="section-subtitle">Our Foundation</span>
                        <div className="separator-container">
                            <div className="separator-line"></div>
                            <span className="separator-text">VISION & MISSION</span>
                            <div className="separator-line"></div>
                        </div>
                        <h2 className="section-title">A Legacy of Excellence</h2>
                    </div>

                    <div className="section-content consolidated-content">
                        {/* Vision Block */}
                        <div className="vision-mission-block">
                            <h3 className="block-label">Our Vision</h3>
                            <p className="primary-statement">
                                "To be an outstanding institution which is an embodiment of excellence, moral uprightness and integrity."
                            </p>
                            <div className="statement-details">
                                <p>
                                    Fad Maestro is an institution that strives for excellence and prominence, not just in name but in terms of academic content and moral input. We aim to reflect this in our overall product—the pupils and students. 
                                </p>
                                <p>
                                    To be an <strong>embodiment</strong> means to nurture our students to be a representation or typical example of quality. Achieving this goal requires the cooperation of parents, students, teachers, and the entire school community. When students cooperate by being punctual, hardworking, and diligent in their assignments, our vision to make them symbols of integrity is actualized.
                                </p>
                            </div>
                        </div>

                        {/* Mission Block */}
                        <div className="vision-mission-block">
                            <h3 className="block-label">Our Mission</h3>
                            <p className="primary-statement">
                                "It is to build generations of academically excellent and reliant youth, nurtured to uphold values and integrity."
                            </p>
                            <div className="statement-details">
                                <p>
                                    When we speak of <strong>generations</strong>, we look at the multiplying effect of our handling of children. We desire that our products excel academically and morally, becoming signposts of integrity. They are expected to be self-reliant in their choice of career, creative, "fountains of ideas," and creators of wealth.
                                </p>
                                <p>
                                    <strong>Integrity</strong> is at the core of everything we do. Our students' "Yes" should be "Yes", even in the face of caution or punishment. They must be truthful in all things—not cheats, deviants, or social burdens, but socially productive leaders at the top of their careers.
                                </p>
                            </div>
                        </div>

                        <div className="final-summary-note">
                            <p>
                                Ultimately, our mission and vision is to see every product of Fad Maestro Schools at the peak of their academic, career, and social potential.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default VisionPage;
