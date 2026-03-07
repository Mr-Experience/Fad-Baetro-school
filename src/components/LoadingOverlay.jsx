import React from 'react';
import './LoadingOverlay.css';
import { supabase } from '../supabaseClient';
import logoFallback from '../assets/logo.jpg';

const LoadingOverlay = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="loading-overlay">
            <div className="loading-content">
                <div className="spinner-container">
                    <div className="loading-spinner"></div>
                    <img src={logoFallback} alt="School Logo" className="loading-logo" />
                </div>
            </div>
        </div>
    );
};

export default LoadingOverlay;
