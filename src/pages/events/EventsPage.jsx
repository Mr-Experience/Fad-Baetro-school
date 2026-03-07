import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import Header from '../../components/Header';
import { supabase } from '../../supabaseClient';
import './EventsPage.css';

const EventsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('system_posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                const now = new Date();
                const past = [];
                const upcoming = [];
                const news = [];

                data.forEach(item => {
                    if (item.type === 'event') {
                        const eDate = new Date(item.event_date);
                        const formattedEvent = {
                            id: item.id,
                            type: item.type,
                            date: eDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                            month: eDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
                            day: eDate.getDate(),
                            year: eDate.getFullYear(),
                            title: item.title,
                            description: item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content,
                            fullContent: item.content,
                            image: item.image_url
                        };

                        if (eDate >= now) {
                            upcoming.push(formattedEvent);
                        } else {
                            past.push(formattedEvent);
                        }
                    } else if (item.type === 'news') {
                        const publishDate = new Date(item.created_at);
                        const formattedNews = {
                            id: item.id,
                            type: item.type,
                            date: publishDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                            title: item.title,
                            description: item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content,
                            fullContent: item.content,
                            image: item.image_url
                        };
                        news.push(formattedNews);
                    }
                });

                // Sort upcoming events chronologically (soonest first)
                upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

                setUpcomingEvents(upcoming);
                setPastEvents(past);
            }
        } catch (err) {
            console.error("Error fetching events:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="events-wrapper">
            <Header />

            <section className="events-hero">
                <div className="container">
                    <h1>SCHOOL EVENTS</h1>
                    <p>Stay up to date with the latest activities and programs at Fad Maestro Academy</p>
                </div>
            </section>

            <div className="events-page">
                {/* Search Section */}
                {/* Search Section */}
                <div className="events-header">
                    <div className="search-section">
                        <div className="search-bar">
                            <Search size={20} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search for events"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="find-events-btn">Find Events</button>
                        </div>
                    </div>

                    {/* Filter Section - Now below search */}
                    <div className="filter-section">
                        <button
                            className={`filter-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            List
                        </button>
                        <button
                            className={`filter-btn ${viewMode === 'month' ? 'active' : ''}`}
                            onClick={() => setViewMode('month')}
                        >
                            Month
                        </button>
                        <button
                            className={`filter-btn ${viewMode === 'day' ? 'active' : ''}`}
                            onClick={() => setViewMode('day')}
                        >
                            Day
                        </button>
                    </div>
                </div>

                {/* Navigation Controls */}
                <div className="events-nav">
                    <div className="nav-controls">
                        <button className="nav-arrow"><ChevronLeft size={20} /></button>
                        <button className="nav-arrow"><ChevronRight size={20} /></button>
                        <button className="today-btn">Today</button>
                    </div>
                    <div className="upcoming-dropdown">
                        <span>Upcoming</span>
                        <ChevronDown size={16} className="dropdown-icon" />
                    </div>
                </div>

                {/* Upcoming Events Section */}
                <div className="upcoming-section">
                    {loading ? (
                        <div className="no-events">Loading events...</div>
                    ) : upcomingEvents.length === 0 ? (
                        <div className="no-events">There are no upcoming events.</div>
                    ) : (
                        <div className="events-list">
                            {upcomingEvents.map(event => (
                                <div key={event.id} className="event-card">
                                    <div className="event-date-badge upcoming-badge">
                                        <div className="date-month">{event.month}</div>
                                        <div className="date-day">{event.day}</div>
                                        <div className="date-year">{event.year}</div>
                                    </div>
                                    <div className="event-details">
                                        <div className="event-date-full" style={{ color: '#10B981', fontWeight: 'bold' }}>{event.date}</div>
                                        <h3 className="event-title">{event.title}</h3>
                                        <p className="event-description">{event.description}</p>
                                        <button className="read-more" onClick={() => setSelectedEvent(event)}>
                                            View Details <ChevronRight size={16} />
                                        </button>
                                    </div>
                                    {event.image && (
                                        <div className="event-image-side">
                                            <img src={event.image} alt={event.title} style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Latest Past Events Section */}
                <div className="past-events-section">
                    <h2 className="section-title">Latest Past Events</h2>
                    <div className="events-list">
                        {loading ? (
                            <div style={{ padding: '20px', color: '#666' }}>Loading past events...</div>
                        ) : pastEvents.length === 0 ? (
                            <div style={{ padding: '20px', color: '#666' }}>No past events found.</div>
                        ) : (
                            pastEvents.map(event => (
                                <div key={event.id} className="event-card">
                                    <div className="event-date-badge">
                                        <div className="date-month">{event.month}</div>
                                        <div className="date-day">{event.day}</div>
                                        <div className="date-year">{event.year}</div>
                                    </div>
                                    <div className="event-details">
                                        <div className="event-date-full">{event.date}</div>
                                        <h3 className="event-title">{event.title}</h3>
                                        <p className="event-description">{event.description}</p>
                                        <button className="read-more" onClick={() => setSelectedEvent(event)}>
                                            View Details <ChevronRight size={16} />
                                        </button>
                                    </div>
                                    {event.image && (
                                        <div className="event-image-side">
                                            <img src={event.image} alt={event.title} style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Read More Modal */}
            {selectedEvent && (
                <div className="news-modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="news-modal" onClick={e => e.stopPropagation()}>
                        <div className="news-modal-header">
                            <h2>Event Details</h2>
                            <button className="news-close-btn" onClick={() => setSelectedEvent(null)}>&times;</button>
                        </div>
                        <div className="news-modal-body">
                            {selectedEvent.image && (
                                <img src={selectedEvent.image} alt={selectedEvent.title} className="news-modal-image" />
                            )}
                            <div className="news-modal-meta" style={{ marginTop: '15px', color: '#64748b', fontWeight: 'bold' }}>
                                <span>{selectedEvent.date}</span>
                            </div>
                            <h3 style={{ fontSize: '24px', margin: '15px 0', color: '#1a365d' }}>{selectedEvent.title}</h3>
                            <div className="news-modal-fulltext" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#475569' }}>
                                {selectedEvent.fullContent}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsPage;
