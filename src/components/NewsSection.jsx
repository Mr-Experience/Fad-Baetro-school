import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MoveRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './NewsSection.css';
import placeholderImg from '../assets/images/school_group_yellow.jpg';

const NewsSection = () => {
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatestNews = async () => {
            try {
                const { data, error } = await supabase
                    .from('system_posts')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(4);

                if (!error && data) {
                    setNewsItems(data.map(item => ({
                        id: item.id,
                        image: item.image_url || placeholderImg,
                        title: item.title,
                        description: item.content.length > 80 ? item.content.substring(0, 80) + '...' : item.content
                    })));
                }
            } catch (err) {
                console.error("Error fetching homepage news:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestNews();
    }, []);

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
                        {loading ? (
                            <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '40px', color: '#666' }}>
                                Loading latest updates...
                            </div>
                        ) : newsItems.length === 0 ? (
                            <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '40px', color: '#666', gridTemplateColumns: 'minmax(0, 1fr)' }}>
                                No recent updates available.
                            </div>
                        ) : (
                            newsItems.map((item) => (
                                <div key={item.id} className="news-card">
                                    <div className="news-card-image watermark-crop">
                                        <img src={item.image} alt={item.title} />
                                    </div>
                                    <div className="news-card-content">
                                        <h3 className="news-card-title">{item.title}</h3>
                                        <p className="news-card-text">{item.description}</p>
                                    </div>
                                </div>
                            ))
                        )}
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
