import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Calendar, User, ChevronRight, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import logoFallback from '../../assets/logo.jpg';
import './NewsPage.css';

const NewsPage = () => {
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const { data, error } = await supabase
                .from('system_posts')
                .select('*')
                .eq('type', 'news')
                .order('created_at', { ascending: false });

            if (!error && data) {
                const formatted = data.map(post => ({
                    id: post.id,
                    title: post.title,
                    date: new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    author: "Admin",
                    category: "Updates",
                    image: post.image_url || "https://images.unsplash.com/photo-1544717297-fa95b3ee51f3?q=80&w=2070&auto=format&fit=crop",
                    excerpt: post.content.substring(0, 100) + "...",
                    fullContent: post.content
                }));
                setNewsItems(formatted);
            }
        } catch (err) {
            console.error("Error fetching news:", err);
        } finally {
            setLoading(false);
        }
    };

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
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading news...</div>
                        ) : newsItems.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>No news updates available.</div>
                        ) : (
                            newsItems.map((item) => (
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
                                        <button className="read-more" onClick={() => setSelectedNews(item)}>
                                            Read More <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <aside className="news-sidebar">
                        <div className="sidebar-widget facebook-widget">
                            <div className="widget-header">
                                <img src={logoFallback} alt="Logo" className="widget-logo" />
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

            {/* Read More Modal */}
            {selectedNews && (
                <div className="news-modal-overlay" onClick={() => setSelectedNews(null)}>
                    <div className="news-modal" onClick={e => e.stopPropagation()}>
                        <div className="news-modal-header">
                            <h2>News Details</h2>
                            <button className="news-close-btn" onClick={() => setSelectedNews(null)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="news-modal-body">
                            <img src={selectedNews.image} alt={selectedNews.title} className="news-modal-image" />
                            <div className="news-modal-meta">
                                <span><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} /> {selectedNews.date}</span>
                            </div>
                            <h3>{selectedNews.title}</h3>
                            <div className="news-modal-fulltext" style={{ whiteSpace: 'pre-wrap' }}>
                                {selectedNews.fullContent}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsPage;
