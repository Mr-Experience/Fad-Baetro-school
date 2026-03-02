import React, { useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Calendar, User, ChevronRight } from 'lucide-react';
import './NewsPage.css';

const NewsPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const newsItems = [
        {
            id: 1,
            title: "DLHS 2025 WASSCE HIGH FLYERS",
            date: "December 2, 2025",
            author: "Admin",
            category: "Academics",
            image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop",
            excerpt: "Celebrating our exceptional students who performed outstandingly in the 2025 WASSCE examinations."
        },
        {
            id: 2,
            title: "Meet the DLHS 2025 UTME Champions",
            date: "July 3, 2025",
            author: "Admin",
            category: "Academics",
            image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=2069&auto=format&fit=crop",
            excerpt: "Another milestone as our students break records in the Unified Tertiary Matriculation Examination."
        },
        {
            id: 3,
            title: "A heartfelt message of appreciation from the Education Secretary",
            date: "June 15, 2025",
            author: "Education Secretary",
            category: "Updates",
            image: "https://images.unsplash.com/photo-1544717297-fa95b3ee51f3?q=80&w=2070&auto=format&fit=crop",
            excerpt: "A message to all DLHS Alumni expressing gratitude for their continuous support and achievements."
        }
    ];

    return (
        <div className="news-page">
            <Header />

            <section className="news-hero">
                <div className="container">
                    <h1>NEWS & UPDATES</h1>
                    <p>Stay Informed, Get the Latest News and Updates from Fad Maestro Academy</p>
                </div>
            </section>

            <main className="news-content">
                <div className="container news-layout">
                    <div className="news-list">
                        <div className="category-label">CATEGORY: NEWS</div>
                        {newsItems.map((item) => (
                            <div key={item.id} className="news-card-horizontal">
                                <div className="news-card-image">
                                    <img src={item.image} alt={item.title} />
                                </div>
                                <div className="news-card-body">
                                    <div className="news-meta">
                                        <span className="meta-item"><Calendar size={14} /> {item.date}</span>
                                    </div>
                                    <h3>{item.title}</h3>
                                    <p>{item.excerpt}</p>
                                    <button className="read-more">
                                        Read More <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <aside className="news-sidebar">
                        <div className="sidebar-widget facebook-widget">
                            <div className="widget-header">
                                <img src="/src/assets/logo.jpg" alt="Logo" className="widget-logo" />
                                <div className="widget-info">
                                    <h4>Fad Maestro Academy</h4>
                                    <span>67,337 followers</span>
                                </div>
                            </div>
                            <div className="widget-content">
                                <div className="facebook-placeholder">
                                    <p>Find us on Facebook</p>
                                    <button className="btn-follow">Follow Page</button>
                                </div>
                            </div>
                        </div>

                        <div className="sidebar-widget">
                            <h3>LATEST UPDATES</h3>
                            <ul className="sidebar-links">
                                {newsItems.map(item => (
                                    <li key={item.id}>
                                        <a href="#">{item.title}</a>
                                        <span>{item.date}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NewsPage;
