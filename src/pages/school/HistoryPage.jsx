import React, { useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './AboutPage.css'; // Reusing styles
import { ArrowDown } from 'lucide-react';
import heroBg from '../../assets/images/school_group_yellow.jpg'; // Updated hero image

const HistoryPage = () => {
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
                    <span className="about-kicker">Our Story</span>
                    <h1 className="about-title">A Legacy of<br />Excellence</h1>
                    <p className="about-description">
                        Tracing the journey of Fad Maestro Nursery & Primary School from its humble beginnings to becoming a beacon of academic and moral standards.
                    </p>
                </div>

                <div className="scroll-indicator" onClick={scrollToContent}>
                    <div className="scroll-arrow-circle">
                        <ArrowDown size={24} color="currentColor" />
                    </div>
                </div>
            </section>

            {/* History Content */}
            <section id="content-section" className="about-section">
                <div className="section-box">
                    <div className="section-header">
                        <span className="section-subtitle">Our Journey</span>
                        <div className="separator-container">
                            <div className="separator-line"></div>
                            <span className="separator-text">OF</span>
                            <div className="separator-line"></div>
                        </div>
                        <h2 className="section-title">Brief History</h2>
                    </div>
                    <div className="section-content">
                        <p>
                            Fad Maestro Nursery & Primary School was founded on November 6th, 2010 with a vision to revolutionize primary education by combining academic rigor with moral integrity. Established by visionaries whose passion for godliness, upright leadership, and moral excellence is well known, the school has grown into a beacon of learning.
                        </p>
                        <p>
                            The institution is a faith-based, non-profit, and co-educational center which provides a holistic education for all-round transformation and empowerment for excellence. The school's motto, <strong>"Leadership with Distinction"</strong>, captures the vision of raising godly leaders who will make a positive impact on their generation.
                        </p>
                        <p>
                            From its humble beginnings with just a few students, Fad Maestro School has expanded its reach, consistently maintaining high standards in both curriculum and character development. Over the years, we have produced graduates who excel in their secondary education and beyond, standing out as ambassadors of integrity and intelligence.
                        </p>
                        <p>
                            Today, the school continues to uphold its founding principles, ensuring that every child is adequately equipped for the future through high-quality education, modern facilities, and a nurturing environment that fosters spiritual and academic growth.
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default HistoryPage;
