import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './NoticeBanner.css';

const NoticeBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="notice-banner">
            <div className="notice-container">
                <div className="notice-content">
                    <AlertTriangle size={20} className="notice-icon" />
                    <p className="notice-text">
                        <strong>Notice:</strong> Admission for 2026/2027 Academic Session is Currently Ongoing.
                    </p>
                </div>
                <button className="notice-close" onClick={() => setIsVisible(false)} aria-label="Close notice">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default NoticeBanner;
