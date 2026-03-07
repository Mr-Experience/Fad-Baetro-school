import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Search, Menu, X, Home, School, Calendar, Users, Image as ImageIcon, ChevronDown, Award, FileText, Library, UserCheck, Monitor, Newspaper, Building2, GraduationCap } from 'lucide-react';
import { supabase } from '../supabaseClient';
import logoFallback from '../assets/logo.jpg';
import './Header.css';

const Header = () => {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(false);
    const [mobileDropdown, setMobileDropdown] = useState(null);
    const [dbLogo, setDbLogo] = useState(null);
    const location = useLocation();

    React.useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('system_settings').select('school_logo_url').eq('id', 1).maybeSingle();
            if (data?.school_logo_url) setDbLogo(data.school_logo_url);
        };
        fetchSettings();
    }, []);

    const toggleDropdown = (menu) => {
        setActiveDropdown(activeDropdown === menu ? null : menu);
    };

    const toggleMobileDropdown = (menu) => {
        setMobileDropdown(mobileDropdown === menu ? null : menu);
    };

    const closeAllDropdowns = () => {
        setActiveDropdown(null);
        setMobileDropdown(null);
        setIsQuickLinksOpen(false);
    };

    const toggleQuickLinks = () => {
        setIsQuickLinksOpen(!isQuickLinksOpen);
        if (!isQuickLinksOpen) {
            setMobileDropdown(null);
        }
    };
    // ... rest of the component logic stays similar

    const isActive = (path) => {
        return location.pathname === path;
    };

    const isParentActive = (paths) => {
        return paths.some(path => location.pathname.startsWith(path));
    };

    return (
        <header className="site-header">
            {/* Header 1 - Top Header */}
            <div className="header-top">
                <div className="header-top-container">
                    {/* Left Section - School Info */}
                    <div className="header-top-left">
                        <div className="school-info">
                            <span className="info-item">
                                <Phone size={18} />
                                08033033398
                            </span>
                            <span className="info-divider">|</span>
                            <span className="info-item">
                                <Mail size={18} />
                                fadmaestro2017@gmail.com
                            </span>
                            <span className="info-divider">|</span>
                            <span className="info-item">
                                <MapPin size={18} />
                                Off Lagos Ibadan Express Road
                            </span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Header 2 - Main Navigation */}
            <div className="header-main">
                <div className="header-main-container">
                    {/* Left Section - Logo */}
                    <div className="header-main-left">
                        <Link to="/" className="school-logo-group">
                            <div className="school-logo">
                                <img src={dbLogo || logoFallback} alt="Fad Maestro Academy" className="logo-img" />
                            </div>
                            <div className="school-branding">
                                <h1 className="school-name">FAD MAESTRO<br />ACADEMY</h1>
                                <p className="school-motto">Knowledge and Service</p>
                            </div>
                        </Link>
                    </div>

                    {/* Center Section - Navigation Menu */}
                    <div className="header-main-center">
                        <nav className="main-nav">
                            <ul className="nav-menu">
                                <li className="nav-item">
                                    <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>HOME</Link>
                                </li>
                                <li className="nav-item has-dropdown">
                                    <span
                                        className={`nav-link ${isParentActive(['/about', '/history', '/vision']) ? 'active' : ''}`}
                                        onClick={() => toggleDropdown('school')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        OUR SCHOOL
                                        <ChevronDown size={14} className="dropdown-icon" />
                                    </span>
                                    <ul className={`dropdown-menu ${activeDropdown === 'school' ? 'show' : ''}`}>
                                        <li><Link to="/about">ABOUT US</Link></li>
                                        <li><Link to="/history">OUR HISTORY</Link></li>
                                        <li><Link to="/vision">VISION & MISSION</Link></li>
                                    </ul>
                                </li>
                                <li className="nav-item">
                                    <Link to="/events" className={`nav-link ${isActive('/events') ? 'active' : ''}`}>EVENTS</Link>
                                </li>
                                <li className="nav-item has-dropdown">
                                    <span
                                        className={`nav-link ${isParentActive(['/process', '/frequently-asked-questions']) ? 'active' : ''}`}
                                        onClick={() => toggleDropdown('admission')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        ADMISSIONS
                                        <ChevronDown size={14} className="dropdown-icon" />
                                    </span>
                                    <ul className={`dropdown-menu ${activeDropdown === 'admission' ? 'show' : ''}`}>
                                        <li><Link to="/process">ADMISSION PROCESS</Link></li>
                                        <li><Link to="/signup" style={{ color: 'var(--primary-600)', fontWeight: 'bold' }}>APPLY NOW</Link></li>
                                        <li><Link to="/frequently-asked-questions">FAQs</Link></li>
                                    </ul>
                                </li>
                                <li className="nav-item has-dropdown">
                                    <span
                                        className={`nav-link ${isParentActive(['/gallery', '/news']) ? 'active' : ''}`}
                                        onClick={() => toggleDropdown('media')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        MEDIA
                                        <ChevronDown size={14} className="dropdown-icon" />
                                    </span>
                                    <ul className={`dropdown-menu ${activeDropdown === 'media' ? 'show' : ''}`}>
                                        <li><Link to="/gallery">GALLERY</Link></li>
                                        <li><Link to="/news">NEWS AND UPDATES</Link></li>
                                    </ul>
                                </li>
                                <li className="nav-item">
                                    <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>CONTACT US</Link>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    {/* Right Section - Quick Actions */}
                    <div className="header-main-right">
                        <div className="quick-actions">
                            <Link to="/search" className="action-icon" title="Search">
                                <Search size={20} />
                            </Link>
                            <button
                                className={`action-icon menu-toggle ${isQuickLinksOpen ? 'active' : ''}`}
                                title="Menu"
                                onClick={toggleQuickLinks}
                            >
                                <span className="icon-menu">
                                    {isQuickLinksOpen ? <X size={24} /> : <Menu size={24} />}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Adaptive Navigation Overlay */}
            {isQuickLinksOpen && (
                <div className="nav-overlay-wrapper" onClick={closeAllDropdowns}>
                    {/* Mode 1: Desktop Quick Links Grid */}
                    <div className="desktop-quick-links" onClick={(e) => e.stopPropagation()}>
                        <div className="quick-links-header">
                            <h2>Quick Links</h2>
                            <button className="desktop-close-btn" onClick={closeAllDropdowns} title="Close">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="quick-links-grid">
                            <Link to="/" className="grid-item" onClick={closeAllDropdowns}>
                                <div className="grid-icon-box"><Home size={32} /></div>
                                <span>Home</span>
                            </Link>
                            <Link to="/about" className="grid-item" onClick={closeAllDropdowns}>
                                <div className="grid-icon-box"><School size={32} /></div>
                                <span>Our School</span>
                            </Link>
                            <Link to="/events" className="grid-item" onClick={closeAllDropdowns}>
                                <div className="grid-icon-box"><Calendar size={32} /></div>
                                <span>Event</span>
                            </Link>
                            <Link to="/process" className="grid-item" onClick={closeAllDropdowns}>
                                <div className="grid-icon-box"><FileText size={32} /></div>
                                <span>Admission</span>
                            </Link>
                            <Link to="/gallery" className="grid-item" onClick={closeAllDropdowns}>
                                <div className="grid-icon-box"><ImageIcon size={32} /></div>
                                <span>Media</span>
                            </Link>
                            <Link to="/contact" className="grid-item" onClick={closeAllDropdowns}>
                                <div className="grid-icon-box"><Phone size={32} /></div>
                                <span>Contact</span>
                            </Link>
                        </div>
                    </div>

                    {/* Mode 2: Mobile Navigation Drawer */}
                    <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-nav-header">
                            <h2 className="mobile-nav-title">Menu</h2>
                            <button className="mobile-nav-close" onClick={closeAllDropdowns}>
                                <X size={24} />
                            </button>
                        </div>

                        <nav className="mobile-nav-content">
                            <ul className="mobile-menu-list">
                                <li className="mobile-menu-item">
                                    <Link to="/" className={`mobile-menu-link ${isActive('/') ? 'active' : ''}`} onClick={closeAllDropdowns}>
                                        <div className="link-content">
                                            <Home size={20} />
                                            <span>HOME</span>
                                        </div>
                                    </Link>
                                </li>

                                <li className="mobile-menu-item has-submenu">
                                    <div
                                        className={`mobile-menu-link ${isParentActive(['/about', '/history', '/vision']) ? 'active' : ''}`}
                                        onClick={() => toggleMobileDropdown('school')}
                                    >
                                        <div className="link-content">
                                            <School size={20} />
                                            <span>OUR SCHOOL</span>
                                        </div>
                                        <ChevronDown size={18} className={`submenu-icon ${mobileDropdown === 'school' ? 'rotate' : ''}`} />
                                    </div>
                                    <ul className={`mobile-submenu ${mobileDropdown === 'school' ? 'open' : ''}`}>
                                        <li><Link to="/about" onClick={closeAllDropdowns}>ABOUT US</Link></li>
                                        <li><Link to="/history" onClick={closeAllDropdowns}>OUR HISTORY</Link></li>
                                        <li><Link to="/vision" onClick={closeAllDropdowns}>VISION & MISSION</Link></li>
                                    </ul>
                                </li>

                                <li className="mobile-menu-item">
                                    <Link to="/events" className={`mobile-menu-link ${isActive('/events') ? 'active' : ''}`} onClick={closeAllDropdowns}>
                                        <div className="link-content">
                                            <Calendar size={20} />
                                            <span>EVENTS</span>
                                        </div>
                                    </Link>
                                </li>

                                <li className="mobile-menu-item has-submenu">
                                    <div
                                        className={`mobile-menu-link ${isParentActive(['/process', '/frequently-asked-questions']) ? 'active' : ''}`}
                                        onClick={() => toggleMobileDropdown('admission')}
                                    >
                                        <div className="link-content">
                                            <Users size={20} />
                                            <span>ADMISSIONS</span>
                                        </div>
                                        <ChevronDown size={18} className={`submenu-icon ${mobileDropdown === 'admission' ? 'rotate' : ''}`} />
                                    </div>
                                    <ul className={`mobile-submenu ${mobileDropdown === 'admission' ? 'open' : ''}`}>
                                        <li><Link to="/process" onClick={closeAllDropdowns}>ADMISSION PROCESS</Link></li>
                                        <li><Link to="/signup" onClick={closeAllDropdowns} style={{ color: 'var(--primary-600)', fontWeight: 'bold' }}>APPLY NOW</Link></li>
                                        <li><Link to="/frequently-asked-questions" onClick={closeAllDropdowns}>FAQs</Link></li>
                                    </ul>
                                </li>

                                <li className="mobile-menu-item has-submenu">
                                    <div
                                        className={`mobile-menu-link ${isParentActive(['/gallery', '/news']) ? 'active' : ''}`}
                                        onClick={() => toggleMobileDropdown('media')}
                                    >
                                        <div className="link-content">
                                            <ImageIcon size={20} />
                                            <span>MEDIA</span>
                                        </div>
                                        <ChevronDown size={18} className={`submenu-icon ${mobileDropdown === 'media' ? 'rotate' : ''}`} />
                                    </div>
                                    <ul className={`mobile-submenu ${mobileDropdown === 'media' ? 'open' : ''}`}>
                                        <li><Link to="/gallery" onClick={closeAllDropdowns}>GALLERY</Link></li>
                                        <li><Link to="/news" onClick={closeAllDropdowns}>NEWS & UPDATES</Link></li>
                                    </ul>
                                </li>

                                <li className="mobile-menu-item">
                                    <Link to="/contact" className={`mobile-menu-link ${isActive('/contact') ? 'active' : ''}`} onClick={closeAllDropdowns}>
                                        <div className="link-content">
                                            <Phone size={20} />
                                            <span>CONTACT US</span>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        </nav>

                        <div className="mobile-nav-footer">
                            <p className="school-motto">Knowledge and Service</p>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
