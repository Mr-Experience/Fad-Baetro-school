import React, { useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './AboutPage.css';
import { ArrowDown } from 'lucide-react';

// Using one of the existing hero images
import heroBg from '../../assets/images/school_group_red.jpg';

const AboutPage = () => {

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const scrollToContent = () => {
        const historySection = document.getElementById('history-section');
        if (historySection) {
            historySection.scrollIntoView({ behavior: 'smooth' });
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
                    <span className="about-kicker">About Us</span>
                    <h1 className="about-title">Leadership With<br />Distinction</h1>
                    <p className="about-description">
                        Fad Maestro Nursery & Primary School is a mission-driven institution committed to providing an all-round and qualitative education with emphasis on academic and moral excellence.
                    </p>
                </div>

                <div className="scroll-indicator" onClick={scrollToContent}>
                    <div className="scroll-arrow-circle">
                        <ArrowDown size={24} color="currentColor" />
                    </div>
                </div>
            </section>

            {/* Brief History Section */}
            <section id="history-section" className="about-section">
                <div className="section-box">
                    <div className="section-header">
                        <span className="section-subtitle">Brief History</span>
                        <div className="separator-container">
                            <div className="separator-line"></div>
                            <span className="separator-text">OF</span>
                            <div className="separator-line"></div>
                        </div>
                        <h2 className="section-title">Fad Maestro School</h2>
                    </div>
                    <div className="section-content">
                        <p>
                            Fad Maestro Nursery & Primary School was founded with a vision to revolutionize primary education by combining academic rigor with moral integrity. Established by visionaries whose passion for godliness, upright leadership, and moral excellence is well known, the school has grown into a beacon of learning.
                        </p>
                        <p>
                            The institution is a faith-based, non-profit, and co-educational center which provides a holistic education for all-round transformation and empowerment for excellence. The school's motto, <strong>"Leadership with Distinction"</strong>, captures the vision of raising godly leaders who will make a positive impact on their generation.
                        </p>
                        <p>
                            From its humble beginnings, Fad Maestro School has expanded its reach, consistently maintaining high standards in both curriculum and character development, ensuring that every child is adequately equipped for the future.
                        </p>
                    </div>
                </div>
            </section>

            {/* Philosophy Section */}
            <section className="about-section white-bg">
                <div className="section-box">
                    <div className="section-header">
                        <span className="section-subtitle">The Philosophy</span>
                        <div className="separator-container">
                            <div className="separator-line"></div>
                            <span className="separator-text">OF</span>
                            <div className="separator-line"></div>
                        </div>
                        <h2 className="section-title">Fad Maestro School</h2>
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

            <Footer />
        </div>
    );
};

export default AboutPage;
