import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';
import { supabase } from '../supabaseClient';
import logoFallback from '../assets/logo.jpg';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer-main-group">
            <div className="footer-container">
                <div className="footer-grid">
                    {/* Column 1: School Info */}
                    <div className="footer-col school-branding-col">
                        <div className="footer-logo-group">
                            <img
                                src={logoFallback}
                                alt="Fad Maestro Academy"
                                className="footer-logo-img"
                            />
                            <div className="footer-branding">
                                <h2 className="footer-school-name">FAD MAESTRO<br />ACADEMY</h2>
                                <p className="footer-school-motto">Knowledge and Service</p>
                            </div>
                        </div>
                        <p className="footer-description">
                            Providing quality education and fostering excellence in every child since 2017.
                        </p>
                        <div className="footer-socials">
                            <a href="#" className="social-icon" aria-label="Facebook"><Facebook size={20} /></a>
                            <a href="#" className="social-icon" aria-label="Instagram"><Instagram size={20} /></a>
                        </div>
                    </div>

                    {/* Column 2: Quick Links - Academics */}
                    <div className="footer-col">
                        <h3 className="footer-heading">ACADEMICS</h3>
                        <ul className="footer-links">
                            <li><Link to="/about">Our School</Link></li>
                            <li><Link to="/events">Events</Link></li>
                            <li><Link to="/gallery">Gallery</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Quick Links - Admission */}
                    <div className="footer-col">
                        <h3 className="footer-heading">ADMISSIONS</h3>
                        <ul className="footer-links">
                            <li><Link to="/process">Admission Process</Link></li>
                            <li><Link to="/frequently-asked-questions">FAQs</Link></li>
                            <li><Link to="/signup">Apply for Admission</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Portals */}
                    <div className="footer-col">
                        <h3 className="footer-heading">PORTALS</h3>
                        <ul className="footer-links">
                            <li><Link to="/portal/student">Student Portal</Link></li>
                            <li><Link to="/portal/candidate">Candidate Portal</Link></li>
                            <li><Link to="/portal/admin/login">Admin Portal</Link></li>
                            <li><Link to="/portal/superadmin">Super Admin</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Contact Info */}
                    <div className="footer-col contact-col">
                        <h3 className="footer-heading">CONTACT US</h3>
                        <div className="footer-contact-info">
                            <div className="contact-item">
                                <MapPin size={20} className="contact-icon" />
                                <span>Off Lagos Ibadan Express Road</span>
                            </div>
                            <div className="contact-item">
                                <Phone size={20} className="contact-icon" />
                                <span>08033033398</span>
                            </div>
                            <div className="contact-item">
                                <Mail size={20} className="contact-icon" />
                                <span>fadmaestro2017@gmail.com</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Fad Maestro Academy. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
