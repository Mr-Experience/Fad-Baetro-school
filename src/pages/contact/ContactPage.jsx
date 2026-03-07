import React, { useState } from 'react';
import { Phone, Mail } from 'lucide-react';
import Header from '../../components/Header';
// ToastContext removed
import { supabase } from '../../supabaseClient';
import './ContactPage.css';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Save to Supabase for Record Keeping
            const { error } = await supabase
                .from('contact_messages')
                .insert([
                    {
                        name: formData.name,
                        phone: formData.phone,
                        email: formData.email.toLowerCase().trim(),
                        subject: formData.subject,
                        message: formData.message
                    }
                ]);

            if (error) throw error;

            // 2. Trigger fallback email client (Optional, but good for direct response)
            const emailBody = `Name: ${formData.name}\nPhone: ${formData.phone}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`;
            const mailtoUrl = `mailto:fadmaestro2017@gmail.com?subject=${encodeURIComponent(formData.subject || 'New Contact Form Message')}&body=${encodeURIComponent(emailBody)}`;

            // Show success and clear
            alert('Your message has been sent successfully! We will get back to you shortly.');

            // Only open mail client if user confirms they want to send a direct copy
            if (window.confirm('Would you also like to open your email client to send a direct copy?')) {
                window.location.href = mailtoUrl;
            }

            setFormData({
                name: '',
                phone: '',
                email: '',
                subject: '',
                message: ''
            });

        } catch (err) {
            console.error("Contact form error:", err);
            alert('Failed to send message: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="contact-page">
                {/* Map Background - Controlled via CSS (Hidden on Mobile) */}
                <div className="contact-map-container">
                    <iframe
                        title="School Location Map"
                        src="https://maps.google.com/maps?q=Fad%20Maestro%20School,%20Along%20oriole-igbehin%20lufuwape%20road,%20off%20Lagos%20Ibadan%20express%20road&t=&z=15&ie=UTF8&iwloc=&output=embed"
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>

                {/* Main Overlaid Contact Card (Overlaps map by 24px) */}
                <div className="contact-overlay-card">
                    {/* Left Section: Info */}
                    <div className="contact-card-info">
                        <h2>Get in touch.</h2>
                        <p className="contact-intro-text">
                            Our dedicated team of passionate educators works tirelessly to ensure
                            that each individual receives the highest quality of education tailored to
                            their unique needs and aspirations.
                        </p>

                        <div className="contact-methods-list">
                            <div className="contact-method-item">
                                <div className="method-icon-circle">
                                    <Phone size={24} />
                                </div>
                                <div className="method-details">
                                    <h4>Call Us</h4>
                                    <p>08033033398</p>
                                </div>
                            </div>

                            <div className="contact-method-item">
                                <div className="method-icon-circle">
                                    <Mail size={24} />
                                </div>
                                <div className="method-details">
                                    <h4>Email Us</h4>
                                    <p>fadmaestro2017@gmail.com</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Section: Form */}
                    <div className="contact-card-form-section">
                        <form onSubmit={handleSubmit}>
                            <div className="contact-form-grid">
                                <div className="form-group">
                                    <label className="contact-form-label">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="contact-form-input"
                                        placeholder="Name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="contact-form-label">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="contact-form-input"
                                        placeholder="Phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label className="contact-form-label">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="contact-form-input"
                                        placeholder="Email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label className="contact-form-label">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        className="contact-form-input"
                                        placeholder="Subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label className="contact-form-label">Message</label>
                                    <textarea
                                        name="message"
                                        className="contact-form-input"
                                        placeholder="Message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            <button type="submit" className="contact-form-submit-btn">Submit</button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ContactPage;
