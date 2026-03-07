import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './NoticeBanner.css';

const NoticeBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="notice-banner">
            <div className="notice-container">
                <Link to="/signup" className="notice-content" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <AlertTriangle size={20} className="notice-icon" />
                    <p className="notice-text" style={{ cursor: 'pointer' }}>
                        <strong>Notice:</strong> Admission for 2026/2027 Academic Session is Currently Ongoing. <u>Apply Now</u>
                    </p>
                </Link>
                <button className="notice-close" onClick={() => setIsVisible(false)} aria-label="Close notice">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default NoticeBanner;
