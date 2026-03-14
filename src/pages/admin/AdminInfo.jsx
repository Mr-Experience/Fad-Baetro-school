import React, { useEffect, useState, useCallback } from 'react';
import './AdminInfo.css';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const AdminInfo = () => {
    const navigate = useNavigate();
    const { userName, userInitial, avatarUrl, profileLoading, userId, infoCache, setInfoCache } = useOutletContext();

    // Content
    const [heroImages, setHeroImages] = useState(infoCache?.hero || []);
    const [mediaItems, setMediaItems] = useState(infoCache?.media || []);
    const [loading, setLoading] = useState({ 
        hero: !infoCache?.hero, 
        media: !infoCache?.media 
    });

    // Media upload modal
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [pendingMediaFile, setPendingMediaFile] = useState(null);
    const [newMediaTitle, setNewMediaTitle] = useState('');
    const [newMediaDesc, setNewMediaDesc] = useState('');
    const [uploading, setUploading] = useState(false);

    // Lightbox
    const [lightbox, setLightbox] = useState(null); // { url, caption }

    useEffect(() => {
        // If we have cached data, show it immediately
        if (infoCache) {
            if (infoCache.hero) setHeroImages(infoCache.hero);
            if (infoCache.media) setMediaItems(infoCache.media);
            setLoading({ hero: false, media: false });
            // Refresh silently in background
            fetchHeroImages(true);
            fetchMediaItems(true);
        } else {
            // First time load
            fetchHeroImages();
            fetchMediaItems();
        }
    }, []);

    // Close lightbox on Escape
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') setLightbox(null); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const fetchHeroImages = async (silent = false) => {
        if (!silent && !heroImages.length) setLoading(prev => ({ ...prev, hero: true }));
        const { data, error } = await supabase
            .from('hero_images')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (!error && data) {
            setHeroImages(data);
            setInfoCache(prev => ({ ...prev, hero: data }));
        }
        setLoading(prev => ({ ...prev, hero: false }));
    };

    const fetchMediaItems = async (silent = false) => {
        if (!silent && !mediaItems.length) setLoading(prev => ({ ...prev, media: true }));
        const { data, error } = await supabase
            .from('media_items')
            .select('*');
        
        if (!error && data) {
            setMediaItems(data);
            setInfoCache(prev => ({ ...prev, media: data }));
        }
        setLoading(prev => ({ ...prev, media: false }));
    };

    const handleUploadHero = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `hero/hero_${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage.from('website_image').upload(path, file);

            if (upErr) {
                if (upErr.message.includes('Bucket not found')) {
                    throw new Error("Storage bucket 'website_image' does not exist. Please check your Supabase Storage settings.");
                }
                throw upErr;
            }
            const { data: { publicUrl } } = supabase.storage.from('website_image').getPublicUrl(path);

            const { error: dbErr } = await supabase.from('hero_images').insert({
                image_url: publicUrl,
                display_order: heroImages.length,
                is_active: true,
                created_by: userId
            });
            if (dbErr) throw dbErr;
            fetchHeroImages(true);
        } catch (err) {
            console.error("Hero upload error:", err);
            if (err.message.includes('row-level security')) {
                alert("Upload failed: Database permission error (RLS). Please ensure you have run the website_setup.sql script in Supabase to allow admin uploads.");
            } else {
                alert("Upload failed: " + err.message);
            }
        }
        finally { setUploading(false); }
    };

    const handleOpenMediaModal = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPendingMediaFile(file);
        setShowMediaModal(true);
        e.target.value = '';
    };

    const handleUploadMedia = async () => {
        if (!pendingMediaFile) return;
        setUploading(true);
        try {
            const ext = pendingMediaFile.name.split('.').pop();
            const path = `media/media_${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage.from('website_image').upload(path, pendingMediaFile);

            if (upErr) {
                if (upErr.message.includes('Bucket not found')) {
                    throw new Error("Storage bucket 'website_image' does not exist.");
                }
                throw upErr;
            }

            const { data: { publicUrl } } = supabase.storage.from('website_image').getPublicUrl(path);

            const { error: dbErr } = await supabase.from('media_items').insert({
                image_url: publicUrl,
                title: newMediaTitle,
                description: newMediaDesc,
                is_active: true,
                created_by: userId
            });
            if (dbErr) throw dbErr;
            setShowMediaModal(false);
            setPendingMediaFile(null);
            setNewMediaTitle('');
            setNewMediaDesc('');
            fetchMediaItems(true);
        } catch (err) {
            console.error("Media upload error:", err);
            if (err.message.includes('row-level security')) {
                alert("Upload failed: Database permission error (RLS). Please ensure you have run the required SQL setup in Supabase to allow admin uploads.");
            } else {
                alert("Upload failed: " + err.message);
            }
        }
        finally { setUploading(false); }
    };

    const handleDelete = async (id, table) => {
        if (!window.confirm("Remove this item?")) return;
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) { alert("Delete failed: " + error.message); return; }
        if (table === 'hero_images') fetchHeroImages();
        else fetchMediaItems();
    };

    const renderIcon = (type) => {
        switch (type) {
            case 'grid': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
            case 'info': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
            case 'user': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
            default: return null;
        }
    };

    return (
        <div className="ai-content">
            <div className="ai-inner-wrap">
                <div className="ai-page-header">
                    <h1 className="ai-page-title">Info Management</h1>
                    <p className="ai-page-subtitle">Manage hero slider images and media gallery.</p>
                </div>

                {/* Hero Section */}
                <section className="ai-section">
                    <div className="ai-section-header">
                        <h2 className="ai-section-title">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                            Hero Images
                        </h2>
                        <label className="ai-upload-btn">
                            <input type="file" accept="image/*" onChange={handleUploadHero} disabled={uploading} />
                            {uploading ? (
                                <>
                                    <div className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: '#374151', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    Add Image
                                </>
                            )}
                        </label>
                    </div>

                    <div className="ai-hero-grid">
                        {loading.hero ? (
                            Array(6).fill(0).map((_, i) => <div key={i} className="ai-hero-card ai-skeleton" />)
                        ) : heroImages.length > 0 ? (
                            heroImages.map(img => (
                                <div key={img.id} className="ai-hero-card" onClick={() => setLightbox({ url: img.image_url, caption: null })}>
                                    <img src={img.image_url} alt="Hero" className="ai-hero-img" />
                                    <div className="ai-card-overlay">
                                        <button className="ai-overlay-btn" onClick={e => { e.stopPropagation(); setLightbox({ url: img.image_url, caption: null }); }}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>View
                                        </button>
                                        <button className="ai-overlay-btn danger" onClick={e => { e.stopPropagation(); handleDelete(img.id, 'hero_images'); }}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="ai-empty-state">
                                <div className="ai-empty-icon">🖼️</div>
                                <p>No hero images yet. Add one to get started.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Media Gallery */}
                <section className="ai-section">
                    <div className="ai-section-header">
                        <h2 className="ai-section-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                            Media Gallery
                        </h2>
                        <label className="ai-upload-btn">
                            <input type="file" accept="image/*" onChange={handleOpenMediaModal} disabled={uploading} />
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Add Media
                        </label>
                    </div>

                    <div className="ai-media-grid">
                        {loading.media ? (
                            Array(6).fill(0).map((_, i) => <div key={i} className="ai-media-card ai-skeleton" />)
                        ) : mediaItems.length > 0 ? (
                            [...mediaItems]
                                .sort((a, b) => (a.title ? -1 : 1) - (b.title ? -1 : 1))
                                .map(item => (
                                    <div key={item.id} className="ai-media-card" onClick={() => setLightbox({ url: item.image_url, caption: item.title || null })}>
                                        <div className="ai-media-img-wrapper">
                                            <img src={item.image_url} alt={item.title || 'Media'} className="ai-media-img" />
                                        </div>
                                        <div className="ai-media-info">
                                            {item.title && <p className="ai-media-title">{item.title}</p>}
                                            {item.description && <p className="ai-media-caption">{item.description}</p>}
                                            <div className="ai-media-footer">
                                                <span className="ai-media-date">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
                                                <button className="ai-remove-inline-btn" title="Remove" onClick={e => { e.stopPropagation(); handleDelete(item.id, 'media_items'); }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <div className="ai-empty-state">
                                <div className="ai-empty-icon">📂</div>
                                <p>Gallery is empty. Upload your first media item.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>{/* /ai-inner-wrap */}

            {/* Lightbox */}
            {lightbox && (
                <div className="ai-lightbox-overlay" onClick={() => setLightbox(null)}>
                    <button className="ai-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
                    <img src={lightbox.url} alt="Preview" className="ai-lightbox-img" onClick={e => e.stopPropagation()} />
                    {lightbox.caption && <p className="ai-lightbox-caption">{lightbox.caption}</p>}
                </div>
            )}

            {/* Media Upload Modal */}
            {showMediaModal && (
                <div className="ai-modal-overlay">
                    <div className="ai-modal">
                        <h3>Upload Media</h3>
                        <p>Add a title and optional description.</p>
                        <label className="ai-modal-label">Title</label>
                        <input type="text" className="ai-modal-input" placeholder="e.g., Science Lab 2024" value={newMediaTitle} onChange={e => setNewMediaTitle(e.target.value)} />
                        <label className="ai-modal-label">Description</label>
                        <textarea className="ai-textarea" placeholder="Short description..." value={newMediaDesc} onChange={e => setNewMediaDesc(e.target.value)} />
                        <div className="ai-modal-actions">
                            <button className="ai-btn-cancel" onClick={() => { setShowMediaModal(false); setPendingMediaFile(null); }}>Cancel</button>
                            <button className="ai-btn-save" onClick={handleUploadMedia} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {uploading ? (
                                    <>
                                        <div className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                        Saving...
                                    </>
                                ) : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInfo;
