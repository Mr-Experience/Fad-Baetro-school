import React from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
    return (
        <>
            {/* Banner Section */}
            <section className="ad-banner">
                <div className="ad-banner-overlay"></div>
                <div className="ad-banner-content">
                    <h1>Welcome Back,</h1>
                    <p>Here's your updated overview</p>
                </div>
            </section>

            {/* Overview Section */}
            <section className="ad-content-grid">
                <div className="ad-overview-card full-width">
                    <div className="ad-card-header">
                        <h2>Admin Dashboard</h2>
                    </div>
                    <div className="ad-empty-dashboard">
                        <p>Welcome to the administration portal. Use the sidebar to navitage through the system.</p>
                    </div>
                </div>
            </section>
        </>
    );
};

export default AdminDashboard;
