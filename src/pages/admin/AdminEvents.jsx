import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import LoadingOverlay from '../../components/LoadingOverlay';
import './AdminEvents.css';

const AdminEvents = () => {
    const { userId } = useOutletContext();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [postType, setPostType] = useState('news'); // 'news' or 'event'
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('system_posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                // Ignore error if table doesn't exist yet
                if (!error.message.includes('does not exist')) {
                    console.error("Error fetching posts:", error);
                }
            } else {
                setPosts(data || []);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSavePost = async () => {
        if (!newTitle || !newContent || (postType === 'event' && !eventDate)) {
            alert('Please fill in all required fields.');
            return;
        }

        setSaving(true);
        try {
            let imageUrl = null;

            // Upload image if provided
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${userId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('portal-assets') // Reusing the gallery bucket
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('portal-assets')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            // Insert into system_posts
            const { error: dbError } = await supabase
                .from('system_posts')
                .insert({
                    type: postType,
                    title: newTitle,
                    content: newContent,
                    image_url: imageUrl,
                    event_date: postType === 'event' ? new Date(eventDate).toISOString() : null
                });

            if (dbError) throw dbError;

            // Reset and refresh
            setShowModal(false);
            setNewTitle('');
            setNewContent('');
            setEventDate('');
            setImageFile(null);
            fetchPosts();

        } catch (err) {
            console.error("Save post error:", err);
            if (err.message.includes('row-level security') || err.message.includes('does not exist')) {
                alert("Database Error: Ensure you ran the SQL setup script for the system_posts table!");
            } else {
                alert("Failed to save post: " + err.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('system_posts').delete().eq('id', id);
            if (error) throw error;
            fetchPosts();
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete post.");
            setLoading(false);
        }
    };

    return (
        <div className="ae-container">
            <LoadingOverlay isVisible={loading || saving} />

            <div className="ae-content-card">
                <div className="ae-header">
                    <div className="ae-title-area">
                        <h1>News & Events Manager</h1>
                        <p>Push updates and schedule events directly to the public website</p>
                    </div>
                    <button className="ae-add-btn" onClick={() => setShowModal(true)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Create Post
                    </button>
                </div>

                <div className="ae-section">
                    <h2 className="ae-section-title">Upcoming Events</h2>
                    <div className="ae-grid">
                        {posts.filter(p => p.type === 'event').length === 0 ? (
                            <p className="ae-empty-text">No events created yet.</p>
                        ) : (
                            posts.filter(p => p.type === 'event').map(post => (
                                <div key={post.id} className="ae-card">
                                    {post.image_url ? (
                                        <img src={post.image_url} alt={post.title} className="ae-card-img" />
                                    ) : (
                                        <div className="ae-card-img-placeholder">No Image</div>
                                    )}
                                    <div className="ae-card-body">
                                        <span className={`ae-badge event-badge`}>
                                            EVENT
                                        </span>
                                        <h3 className="ae-card-title">{post.title}</h3>
                                        <p className="ae-card-excerpt">{post.content.substring(0, 80)}...</p>

                                        {post.event_date && (
                                            <div className="ae-date-strip">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                {new Date(post.event_date).toLocaleDateString()}
                                            </div>
                                        )}

                                        <button className="ae-delete-btn" onClick={() => handleDelete(post.id)}>
                                            Delete Post
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="ae-section" style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '40px' }}>
                    <h2 className="ae-section-title">News & Updates</h2>
                    <div className="ae-grid">
                        {posts.filter(p => p.type === 'news').length === 0 ? (
                            <p className="ae-empty-text">No news updates created yet.</p>
                        ) : (
                            posts.filter(p => p.type === 'news').map(post => (
                                <div key={post.id} className="ae-card">
                                    {post.image_url ? (
                                        <img src={post.image_url} alt={post.title} className="ae-card-img" />
                                    ) : (
                                        <div className="ae-card-img-placeholder">No Image</div>
                                    )}
                                    <div className="ae-card-body">
                                        <span className={`ae-badge news-badge`}>
                                            NEWS
                                        </span>
                                        <h3 className="ae-card-title">{post.title}</h3>
                                        <p className="ae-card-excerpt">{post.content.substring(0, 80)}...</p>

                                        <button className="ae-delete-btn" onClick={() => handleDelete(post.id)}>
                                            Delete Post
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="ae-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="ae-modal" onClick={e => e.stopPropagation()}>
                        <div className="ae-modal-header">
                            <h2>Create New Post</h2>
                            <button className="ae-close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>

                        <div className="ae-modal-body">
                            <div className="ae-type-selector">
                                <button
                                    className={`ae-type-btn ${postType === 'news' ? 'active' : ''}`}
                                    onClick={() => setPostType('news')}
                                >
                                    News / Update
                                </button>
                                <button
                                    className={`ae-type-btn ${postType === 'event' ? 'active' : ''}`}
                                    onClick={() => setPostType('event')}
                                >
                                    Upcoming Event
                                </button>
                            </div>

                            <div className="ae-form-group">
                                <label>Title*</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="Enter title..."
                                />
                            </div>

                            {postType === 'event' && (
                                <div className="ae-form-group">
                                    <label>Event Date*</label>
                                    <input
                                        type="date"
                                        value={eventDate}
                                        onChange={e => setEventDate(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="ae-form-group">
                                <label>Content Details*</label>
                                <textarea
                                    rows="5"
                                    value={newContent}
                                    onChange={e => setNewContent(e.target.value)}
                                    placeholder="Write the full description here..."
                                ></textarea>
                            </div>

                            <div className="ae-form-group">
                                <label>Cover Image (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                        </div>

                        <div className="ae-modal-footer">
                            <button className="ae-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="ae-save-btn" onClick={handleSavePost}>Publish Post</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEvents;
