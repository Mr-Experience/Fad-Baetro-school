import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { supabase } from '../../supabaseClient';
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
    const [galleryItems, setGalleryItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMediaItems = async () => {
            const { data, error } = await supabase
                .from('media_items')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (!error && data) {
                // Determine layout sizing sequentially like the hardcopied version
                // Pattern: [wide, normal], [normal, wide], [wide, normal]...
                const formattedData = data.map((item, index) => {
                    const row = Math.floor(index / 2);
                    const positionInRow = index % 2;

                    let size = 'normal';
                    if (row % 2 === 0) {
                        // Even rows: Wide | Normal
                        size = positionInRow === 0 ? 'wide' : 'normal';
                    } else {
                        // Odd rows: Normal | Wide
                        size = positionInRow === 0 ? 'normal' : 'wide';
                    }

                    return {
                        id: item.id,
                        type: item.description || item.title ? 'captioned' : 'image',
                        size: size,
                        src: item.image_url,
                        title: item.title,
                        description: item.description
                    };
                });
                setGalleryItems(formattedData);
            }
            setLoading(false);
        };

        fetchMediaItems();
    }, []);

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
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
                                <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                <p>Loading gallery...</p>
                            </div>
                        ) : galleryItems.length > 0 ? (
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
                                                        {item.title && <h3>{item.title}</h3>}
                                                        {item.description && <p>{item.description}</p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
                                <p>No media items found. Check back later!</p>
                            </div>
                        )}
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
