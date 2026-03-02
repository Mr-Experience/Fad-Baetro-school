import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import Header from '../../components/Header';
import './EventsPage.css';

const EventsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list');

    // Sample past events data (admin will add real events later)
    const pastEvents = [
        {
            id: 1,
            date: 'December 25, 2023',
            month: 'DEC',
            day: '25',
            year: '2023',
            title: 'christmas day',
            description: 'join us at Fad Maestro Academy for Christmas celebration'
        },
        {
            id: 2,
            date: 'December 13, 2023',
            month: 'DEC',
            day: '13',
            year: '2023',
            title: 'Carol Service 2023',
            description: 'Fad Maestro Academy. Carol Service 2023.',
            tag: 'free'
        },
        {
            id: 3,
            date: 'July 23, 2023 - November 30, 2023',
            month: 'JUL',
            day: '23',
            year: '2023',
            title: 'Admissions',
            description: 'Fad Maestro Academy\nAdmissions form are now on sale'
        }
    ];

    const upcomingEvents = []; // Empty for now - admin will add events

    return (
        <>
            <Header />
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
                    {upcomingEvents.length === 0 ? (
                        <div className="no-events">
                            There are no upcoming events.
                        </div>
                    ) : (
                        <div className="events-list">
                            {upcomingEvents.map(event => (
                                <div key={event.id} className="event-card">
                                    {/* Event content will go here */}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Latest Past Events Section */}
                <div className="past-events-section">
                    <h2 className="section-title">Latest Past Events</h2>
                    <div className="events-list">
                        {pastEvents.map(event => (
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
                                    {event.tag && <span className="event-tag">{event.tag}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default EventsPage;
