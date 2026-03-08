import React from 'react';
import { Home, GraduationCap, Users } from 'lucide-react';
import './AcademicsSection.css';

const AcademicsSection = () => {
    const cards = [
        {
            icon: <Home size={40} strokeWidth={1.5} />,
            title: "Excellency",
            description: "We offer the best knowledge to our students, exceeding imaginations."
        },
        {
            icon: <GraduationCap size={40} strokeWidth={1.5} />,
            title: "Best Results",
            description: "Our students consistently graduate with flying colors and core values."
        },
        {
            icon: <Users size={40} strokeWidth={1.5} />,
            title: "Charity",
            description: "We teach social responsibility and build characters for a better society."
        }
    ];

    return (
        <section className="academics-section section-padding">
            <div className="academics-container container-std">
                <div className="academics-left">
                    <span className="subtitle-caps">
                        <span className="subtitle-line"></span>
                        OUR ACADEMICS
                    </span>
                    <h2 className="academics-title h2-large">Making Your Child's World Better</h2>
                    <p className="academics-tagline">Excellence is our priority!</p>
                </div>

                <div className="academics-right">
                    <div className="academics-grid">
                        {cards.map((card, index) => (
                            <div key={index} className="academics-card">
                                <div className="academics-icon-wrapper">
                                    {card.icon}
                                </div>
                                <h3 className="academics-card-title">{card.title}</h3>
                                <p className="academics-card-text">{card.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AcademicsSection;
