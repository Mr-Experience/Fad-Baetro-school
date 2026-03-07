import React from 'react';
import Header from '../../components/Header';
import Hero from '../../components/Hero';
import NoticeBanner from '../../components/NoticeBanner';
import AdmissionSection from '../../components/AdmissionSection';
import WelcomeSection from '../../components/WelcomeSection';
import AcademicsSection from '../../components/AcademicsSection';
import NewsSection from '../../components/NewsSection';
import TestimonialsSection from '../../components/TestimonialsSection';
import PortalQuickAccess from '../../components/PortalQuickAccess';
import InquirySection from '../../components/InquirySection';
import Footer from '../../components/Footer';
import './HomePage.css';

const HomePage = () => {
    return (
        <div className="home-page">
            <Header />
            <Hero />
            <NoticeBanner />
            <AdmissionSection />
            <WelcomeSection />
            <AcademicsSection />
            <NewsSection />
            <PortalQuickAccess />
            <TestimonialsSection />
            <main className="home-content">
                {/* Content will be added here */}
            </main>
            <InquirySection />
            <Footer />
        </div>
    );
};

export default HomePage;
