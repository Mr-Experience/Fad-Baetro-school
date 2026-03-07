import React from 'react';
import { Link } from 'react-router-dom';
import { MoveRight } from 'lucide-react';
import './WelcomeSection.css';
import welcomeImg from '../assets/images/school_group_yellow.jpg';

const WelcomeSection = () => {
    return (
        <section className="welcome-section section-padding">
            <div className="welcome-container container-std">
                <div className="welcome-content">
                    <div className="welcome-subtitle-wrapper subtitle-caps">
                        <span className="subtitle-line"></span>
                        WELCOME TO
                    </div>

                    <h2 className="welcome-title h2-large">
                        FAD MAESTRO <br />
                        NURSERY & PRIMARY SCHOOL
                    </h2>

                    <div className="welcome-text">
                        <p>
                            Fad Maestro Nursery & Primary School was founded with a vision to provide
                            world-class education that nurtures the unique potential of every child.
                            Our commitment to excellence, character development, and academic
                            rigour is well known globally.
                        </p>
                        <p>
                            We started our journey with a focus on holistic development,
                            ensuring our pupils are well-prepared for the challenges of the future.
                            Over time, we have grown into a dedicated community of learners,
                            celebrating progress in our students' states of growth and character.
                        </p>
                    </div>

                    <div className="welcome-actions">
                        <Link to="/about" className="btn btn-primary">
                            About Us <MoveRight size={18} />
                        </Link>
                    </div>
                </div>

                <div className="welcome-image-container">
                    <img
                        src={welcomeImg}
                        alt="Fad Maestro Classroom"
                        className="welcome-main-image"
                    />
                    <div className="welcome-image-decoration"></div>
                </div>
            </div>
        </section>
    );
};

export default WelcomeSection;
