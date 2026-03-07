import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import './AdmissionSection.css';
import admissionImg from '../assets/images/school_group_red.jpg';

const AdmissionSection = () => {
    const [isPortalDropdownOpen, setIsPortalDropdownOpen] = useState(false);

    return (
        <section className="admission-section section-padding">
            <div className="admission-grid container-std">
                <div className="admission-left">
                    <div className="admission-card">
                        <h2 className="admission-title">FIRST ENTRANCE <br /> EXAMINATION 2026/2027 <br /> SESSION</h2>
                        <p className="admission-text">
                            This is to notify the general public that the Fad Maestro Academy First Entrance Examination
                            comes up on <strong>Saturday, 11th April 2026, by 9.00am</strong>.
                            Interested candidates should begin to apply immediately.
                        </p>
                        <div className="admission-actions">
                            <Link to="/process" className="btn btn-accent">
                                VIEW ADMISSION PROCESS
                            </Link>
                            <Link to="/signup" className="btn btn-accent">
                                APPLY ONLINE NOW
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="admission-right">
                    <div className="admission-image-wrapper watermark-crop">
                        <img
                            src={admissionImg}
                            alt="Fad Maestro Students"
                            className="admission-img"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AdmissionSection;
