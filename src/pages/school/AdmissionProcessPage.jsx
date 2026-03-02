import React, { useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { UserPlus, FormInput, CheckCircle, Smartphone, Globe, ClipboardCheck } from 'lucide-react';
import './AdmissionProcessPage.css';

const AdmissionProcessPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const steps = [
        {
            icon: <Globe className="step-icon" />,
            title: "Visit Our Website",
            description: "Go to the official school website at fadmaestro.org or navigate directly to the admission section."
        },
        {
            icon: <Smartphone className="step-icon" />,
            title: "Create An Account",
            description: "Click on 'CREATE A NEW ACCOUNT' in the Admission Portal. This will be your primary portal for tracking applications."
        },
        {
            icon: <UserPlus className="step-icon" />,
            title: "Parent/Guardian Profile",
            description: "Fill in your personal details as a Parent or Guardian. You can manage applications for multiple children under one account."
        },
        {
            icon: <FormInput className="step-icon" />,
            title: "Apply For Admission",
            description: "After registration, login and click 'Apply for Admission'. Here you will add your child's details."
        },
        {
            icon: <ClipboardCheck className="step-icon" />,
            title: "Complete Admission Form",
            description: "Fill in the required academic and personal information in the online admission form carefully."
        },
        {
            icon: <CheckCircle className="step-icon" />,
            title: "Submission & Confirmation",
            description: "Submit the form. You will receive a confirmation email with the completed form for your records."
        }
    ];

    return (
        <div className="admission-process-page">
            <Header />

            <section className="admission-hero">
                <div className="container">
                    <span className="hero-subtitle">ADMISSION GUIDE</span>
                    <h1>How to Apply for <br /><span className="highlight">Fad Maestro Academy</span></h1>
                    <p>Follow these simple steps to join our community of great leaders. No application fees required.</p>
                </div>
            </section>

            <main className="admission-content">
                <div className="container">
                    <div className="process-grid">
                        {steps.map((step, index) => (
                            <div key={index} className="process-card">
                                <div className="step-number">{index + 1}</div>
                                <div className="icon-wrapper">
                                    {step.icon}
                                </div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="admission-notice">
                        <div className="notice-card">
                            <h4>Important Notice</h4>
                            <ul>
                                <li>Ensure all information provided is accurate and matches official documents.</li>
                                <li>The admission portal is accessible 24/7 for your convenience.</li>
                                <li>If you encounter any issues, please contact our support desk via the contact page.</li>
                            </ul>
                            <div className="btn-wrapper">
                                <button className="btn-apply-now">Start Application Now</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AdmissionProcessPage;
