import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Hero.css';

import hero1 from '../assets/images/hero_slides/hero_1.jpg';
import hero2 from '../assets/images/hero_slides/hero_2.jpg';

const Hero = () => {
    const images = [
        hero1,
        hero2
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 5000); // 5 seconds auto-change
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="hero-section">
            <div className="hero-slider">
                {images.map((image, index) => (
                    <div
                        key={index}
                        className={`hero-slide ${index === currentIndex ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${image})` }}
                    />
                ))}
            </div>

            <div className="hero-controls">
                <button className="control-btn prev" onClick={prevSlide} aria-label="Previous slide">
                    <ChevronLeft size={32} />
                </button>
                <button className="control-btn next" onClick={nextSlide} aria-label="Next slide">
                    <ChevronRight size={32} />
                </button>
            </div>

            <div className="hero-indicators">
                {images.map((_, index) => (
                    <button
                        key={index}
                        className={`indicator ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default Hero;
