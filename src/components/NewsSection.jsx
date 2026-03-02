import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MoveRight } from 'lucide-react';
import './NewsSection.css';
import newsImg from '../assets/images/school_group_yellow.jpg';

const NewsSection = () => {
    const newsItems = [
        {
            id: 1,
            image: "/src/assets/images/gallery_photo_1.jpg",
            title: "School Resumption Notice",
            description: "Detailed information about the 2026/2027 academic session resumption dates and requirements."
        },
        {
            id: 2,
            image: "/src/assets/images/gallery_photo_2.jpg",
            title: "Outstanding Performance",
            description: "Celebrating our students who achieved exceptional results in the recent national competitions."
        },
        {
            id: 3,
            image: "/src/assets/images/gallery_photo_3.jpg",
            title: "Community Outreach",
            description: "Fad Maestro students visiting local centers as part of our character development program."
        },
        {
            id: 4,
            image: "/src/assets/images/gallery_photo_4.jpg",
            title: "Upcoming Sports Day",
            description: "Get ready for our annual inter-house sports competition. Parents are invited to join the fun!"
        }
    ];

    return (
        <section className="news-section">
            <div className="news-container">
                <div className="news-header">
                    <div className="news-title-wrapper">
                        <span className="news-indicator"></span>
                        <h2 className="news-title">Fad Maestro News & Updates</h2>
                    </div>
                    <Link to="/events" className="news-view-more">
                        View More <MoveRight size={18} />
                    </Link>
                </div>

                <div className="news-slider-wrapper">
                    <button className="news-nav-btn prev">
                        <ChevronLeft size={24} />
                    </button>

                    <div className="news-grid">
                        {newsItems.map((item) => (
                            <div key={item.id} className="news-card">
                                <div className="news-card-image watermark-crop">
                                    <img src={newsImg} alt={item.title} />
                                </div>
                                <div className="news-card-content">
                                    <h3 className="news-card-title">{item.title}</h3>
                                    <p className="news-card-text">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="news-nav-btn next">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default NewsSection;
