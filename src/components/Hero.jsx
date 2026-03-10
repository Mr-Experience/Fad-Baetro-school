import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Hero.css';
import defaultHero from '../assets/images/school_group_yellow.jpg';

const Hero = () => {
    // Initialize with fallback image so it's not empty while loading or if DB is empty
    const [images, setImages] = useState([defaultHero]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchHeroImages = async () => {
            const { data, error } = await supabase
                .from('hero_images')
                .select('image_url')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (!error && data && data.length > 0) {
                setImages(data.map(img => img.image_url));
            }
            // else leave it with the defaultHero
        };

        fetchHeroImages();
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    useEffect(() => {
        if (images.length <= 1) return; // Don't auto-slide if only 1 image

        const interval = setInterval(() => {
            nextSlide();
        }, 5000); // 5 seconds auto-change
        return () => clearInterval(interval);
    }, [images.length]);

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
