import React from 'react';
import './LoadingOverlay.css';
import { supabase } from '../supabaseClient';
import logoFallback from '../assets/logo.jpg';

const LoadingOverlay = ({ isVisible }) => {
    const [dbLogo, setDbLogo] = React.useState(null);

    React.useEffect(() => {
        if (!isVisible) return;
        const fetchSettings = async () => {
            const { data } = await supabase.from('system_settings').select('school_logo_url').eq('id', 1).maybeSingle();
            if (data?.school_logo_url) setDbLogo(data.school_logo_url);
        };
        fetchSettings();
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className="loading-overlay">
            <div className="loading-content">
                <div className="spinner-container">
                    <div className="loading-spinner"></div>
                    <img src={dbLogo || logoFallback} alt="School Logo" className="loading-logo" />
                </div>
            </div>
        </div>
    );
};

export default LoadingOverlay;
