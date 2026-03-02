import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './GalleryPage.css';

const ImageWithZoom = ({ src, alt }) => {
    const [isZoomed, setIsZoomed] = useState(false);

    const toggleZoom = (e) => {
        e.stopPropagation();
        setIsZoomed(!isZoomed);
    };

    return (
        <img
            src={src}
            alt={alt}
            className={isZoomed ? 'zoomed' : ''}
            onClick={toggleZoom}
            style={{
                transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
                cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                transition: 'transform 0.3s ease'
            }}
        />
    );
};

const GalleryPage = () => {
    const [selectedImage, setSelectedImage] = useState(null);

    // Placeholder data - User will replace these later
    const galleryItems = [
        {
            id: 1,
            type: 'captioned',
            src: '/src/assets/images/lagos_assembly_corrected.jpg',
            title: 'Lagos State House of Assembly',
            description: 'During a visit to Lagos State House of Assembly.'
        },
        {
            id: 2,
            type: 'captioned',
            src: '/src/assets/images/neco_certification_corrected.jpg',
            title: 'NECO Certification',
            description: 'Receiving our NECO certification.'
        },
        {
            id: 3,
            type: 'captioned',
            src: '/src/assets/images/obasanjo_library.png',
            title: 'Olusegun Obasanjo Presidential Library',
            description: 'A visit to Olusegun Obasanjo Presidential Library.'
        },
        // Additional standalone images - Organized Alternating Pattern
        // Row 1: Left Wide (2 cols) + Right Normal (1 col)
        {
            id: 4,
            type: 'image',
            size: 'wide',
            src: '/src/assets/images/gallery_photo_1.jpg',
        },
        {
            id: 5,
            type: 'image',
            size: 'normal',
            src: '/src/assets/images/gallery_photo_2.jpg',
        },
        // Row 2: Left Normal (1 col) + Right Wide (2 cols)
        {
            id: 6,
            type: 'image',
            size: 'normal',
            src: '/src/assets/images/gallery_photo_3.jpg',
        },
        {
            id: 7,
            type: 'image',
            size: 'wide',
            src: '/src/assets/images/gallery_photo_4.jpg',
        },
        // Row 3: Left Wide (2 cols) + Right Normal (1 col)
        {
            id: 8,
            type: 'image',
            size: 'wide',
            src: '/src/assets/images/gallery_photo_5.jpg',
        },
        {
            id: 9,
            type: 'image',
            size: 'normal',
            src: '/src/assets/images/gallery_photo_6.jpg',
        },
        // Row 4: Left Normal (1 col) + Right Wide (2 cols)
        {
            id: 10,
            type: 'image',
            size: 'normal',
            src: '/src/assets/images/gallery_photo_7.jpg',
        },
        {
            id: 11,
            type: 'image',
            size: 'wide',
            src: '/src/assets/images/gallery_photo_8.jpg',
        },
        // Row 5: Left Wide (2 cols) + Right Normal (1 col)
        {
            id: 12,
            type: 'image',
            size: 'wide',
            src: '/src/assets/images/gallery_photo_9.jpg',
        },
        {
            id: 13,
            type: 'image',
            size: 'normal',
            src: '/src/assets/images/gallery_photo_10.jpg',
        }];

    const openLightbox = (item) => {
        setSelectedImage(item);
    };

    const closeLightbox = () => {
        setSelectedImage(null);
    };

    return (
        <div className="gallery-page">
            <Header />

            <main className="gallery-content">
                <section className="gallery-hero">
                    <div className="gallery-hero-text">
                        <h1>Our Gallery</h1>
                        <p>Capturing moments and memories at Fad Maestro Academy</p>
                    </div>
                </section>

                <section className="gallery-grid-section">
                    <div className="gallery-container">
                        <div className="gallery-grid">
                            {galleryItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`gallery-item ${item.type} ${item.size || ''}`}
                                    onClick={() => openLightbox(item)}
                                >
                                    <div className="image-wrapper">
                                        <img src={item.src} alt={item.title || 'Gallery Image'} loading="lazy" />

                                        {item.type === 'captioned' && (
                                            <div className="caption-overlay">
                                                <div className="caption-content">
                                                    {/* Title removed as per "single text is enough" request */}
                                                    <p>{item.description}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={closeLightbox}>&times;</button>
                        <ImageWithZoom
                            src={selectedImage.src}
                            alt={selectedImage.title || 'Gallery Image'}
                        />
                        {selectedImage.type === 'captioned' && (
                            <div className="lightbox-caption">
                                <h3>{selectedImage.title}</h3>
                                <p>{selectedImage.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default GalleryPage;
