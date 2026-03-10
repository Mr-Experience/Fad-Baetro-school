import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Mail, Trash2, Calendar, Phone, User, MessageSquare } from 'lucide-react';
import './AdminMessages.css';

const AdminMessages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('not found')) {
                    // Table doesn't exist yet
                    setMessages([]);
                } else {
                    throw error;
                }
            } else {
                setMessages(data || []);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteMessage = async (id) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            const { error } = await supabase
                .from('contact_messages')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMessages(messages.filter(m => m.id !== id));
            if (selectedMessage?.id === id) setSelectedMessage(null);
        } catch (err) {
            alert('Error deleting message: ' + err.message);
        }
    };

    return (
        <div className="admin-messages-container">
            <div className="messages-header">
                <div className="header-title">
                    <Mail size={24} />
                    <h2>Contact Messages</h2>
                </div>
                <button onClick={fetchMessages} className="refresh-btn">Refresh</button>
            </div>

            <div className="messages-layout">
                {/* Message List */}
                <div className="messages-list-panel">
                    {loading ? (
                        <div className="loading-state">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="empty-state">
                            <MessageSquare size={48} />
                            <p>No messages found.</p>
                            <small>Ensure the 'contact_messages' table is created in Supabase.</small>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div 
                                key={msg.id} 
                                className={`message-item ${selectedMessage?.id === msg.id ? 'active' : ''}`}
                                onClick={() => setSelectedMessage(msg)}
                            >
                                <div className="message-item-header">
                                    <span className="msg-candidate">{msg.name}</span>
                                    <span className="msg-date">{new Date(msg.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="msg-subject">{msg.subject || 'No Subject'}</div>
                                <div className="msg-preview">{msg.message.substring(0, 60)}...</div>
                            </div>
                        ))
                    )}
                </div>

                {/* Message Detail View */}
                <div className="message-detail-panel">
                    {selectedMessage ? (
                        <div className="message-detail-content">
                            <div className="detail-header">
                                <h3>{selectedMessage.subject || 'No Subject'}</h3>
                                <button className="delete-icon-btn" onClick={() => deleteMessage(selectedMessage.id)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="sender-info-grid">
                                <div className="info-item">
                                    <User size={16} />
                                    <span><strong>From:</strong> {selectedMessage.name}</span>
                                </div>
                                <div className="info-item">
                                    <Mail size={16} />
                                    <span><strong>Email:</strong> <a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a></span>
                                </div>
                                <div className="info-item">
                                    <Phone size={16} />
                                    <span><strong>Phone:</strong> {selectedMessage.phone || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <Calendar size={16} />
                                    <span><strong>Date:</strong> {new Date(selectedMessage.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="message-body-container">
                                <label>Message Content:</label>
                                <div className="message-text">
                                    {selectedMessage.message}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="no-selection-state">
                            <Mail size={64} opacity={0.2} />
                            <p>Select a message to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminMessages;
