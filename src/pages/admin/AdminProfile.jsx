import React, { useEffect, useState, useRef } from 'react';
import './AdminProfile.css';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const AdminProfile = () => {
    const navigate = useNavigate();
    const {
        userName, setUserName,
        userInitial, setUserInitial,
        avatarUrl, setAvatarUrl,
        profileLoading, userId
    } = useOutletContext();

    // Name form
    const [fullName, setFullName] = useState('');
    const [nameLoading, setNameLoading] = useState(false);
    const [nameMsg, setNameMsg] = useState({ type: '', text: '' });

    // Sync local fullName with context userName on mount or update
    useEffect(() => {
        if (userName) setFullName(userName);
    }, [userName]);

    // Password form... (rest of the states remain same)
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

    const [avatarLoading, setAvatarLoading] = useState(false);
    const fileInputRef = useRef(null);

    const userRole = 'Admin'; // Or get from context if needed

    // Save full name
    const handleSaveName = async () => {
        if (!fullName.trim()) {
            setNameMsg({ type: 'error', text: 'Full name cannot be empty.' });
            return;
        }
        setNameLoading(true);
        setNameMsg({ type: '', text: '' });

        const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName.trim() })
            .eq('id', userId);

        if (error) {
            setNameMsg({ type: 'error', text: 'Failed to update name. Please try again.' });
        } else {
            setUserName(fullName.trim());
            setUserInitial(fullName.trim().charAt(0).toUpperCase());
            setNameMsg({ type: 'success', text: 'Full name updated successfully!' });
        }
        setNameLoading(false);
    };

    // Change password
    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwMsg({ type: 'error', text: 'Passwords do not match.' });
            return;
        }
        setPwLoading(true);
        setPwMsg({ type: '', text: '' });

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setPwMsg({ type: 'error', text: 'Failed to change password. ' + error.message });
        } else {
            setPwMsg({ type: 'success', text: 'Password changed successfully!' });
            setNewPassword('');
            setConfirmPassword('');
        }
        setPwLoading(false);
    };

    // Upload avatar
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be under 2MB.');
            return;
        }

        setAvatarLoading(true);
        const filePath = `public/${userId}.png`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            alert('Failed to upload image: ' + uploadError.message);
            setAvatarLoading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', userId);

        setAvatarUrl(publicUrl);
        setAvatarLoading(false);
    };

    return (
        <div className="ap-content">
            <div className="ap-inner-wrap">
                <h1 className="ap-page-title">My Profile</h1>

                <div className="ap-layout">
                    {/* Avatar Card */}
                    <div className="ap-avatar-card">
                        <div className="ap-avatar-wrapper">
                            {avatarUrl
                                ? <img src={avatarUrl} alt="Profile" className="ap-avatar-img" />
                                : <div className="ap-avatar-placeholder">{userInitial}</div>
                            }
                            <label className="ap-avatar-upload-btn" title="Change photo">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    disabled={avatarLoading}
                                />
                                {avatarLoading
                                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" opacity="0.25" /></svg>
                                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                }
                            </label>
                        </div>
                        <div className="ap-avatar-name">{userName}</div>
                        <div className="ap-avatar-role">{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</div>
                        <div className="ap-avatar-hint">Click the upload icon to change your profile photo. Max size 2MB.</div>
                    </div>

                    {/* Right Column */}
                    <div className="ap-form-column">
                        {/* Name Card */}
                        <div className="ap-card">
                            <div className="ap-card-title">Personal Information</div>
                            <div className="ap-card-subtitle">Update your display name</div>
                            <div className="ap-divider"></div>

                            <div className="ap-alert-container">
                                {nameMsg.text && (
                                    <div className={`ap-alert ${nameMsg.type}`}>{nameMsg.text}</div>
                                )}
                            </div>

                            <div className="ap-form-group">
                                <label className="ap-label">Full Name</label>
                                <input
                                    type="text"
                                    className="ap-input"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="ap-card-footer">
                                <button className="ap-btn-primary" onClick={handleSaveName} disabled={nameLoading}>
                                    {nameLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        {/* Vertical Divider */}
                        <div className="ap-col-divider" />

                        {/* Password Card */}
                        <div className="ap-card">
                            <div className="ap-card-title">Change Password</div>
                            <div className="ap-card-subtitle">Use a strong password you haven't used before</div>
                            <div className="ap-divider"></div>

                            <div className="ap-alert-container">
                                {pwMsg.text && (
                                    <div className={`ap-alert ${pwMsg.type}`}>{pwMsg.text}</div>
                                )}
                            </div>

                            <div className="ap-form-group">
                                <label className="ap-label">New Password</label>
                                <input
                                    type="password"
                                    className="ap-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    autoComplete="new-password"
                                />
                                <div className="ap-password-rules">At least 8 characters with a mix of letters and numbers.</div>
                            </div>

                            <div className="ap-form-group">
                                <label className="ap-label">Confirm Password</label>
                                <input
                                    type="password"
                                    className="ap-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="ap-card-footer">
                                <button className="ap-btn-primary" onClick={handleChangePassword} disabled={pwLoading}>
                                    {pwLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
