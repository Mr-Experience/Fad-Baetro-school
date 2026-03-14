import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Camera, Shield, Loader2 } from 'lucide-react';
import './AdminProfile.css';

const AdminProfile = () => {
    const navigate = useNavigate();
    
    // OMNI-FILL: Accessing global state for instant data
    const {
        userName, setUserName,
        userInitial, setUserInitial,
        avatarUrl, setAvatarUrl,
        profileLoading, userId, userRole
    } = useOutletContext();

    // Local form state
    const [fullName, setFullName] = useState(userName || '');
    const [nameLoading, setNameLoading] = useState(false);
    const [nameMsg, setNameMsg] = useState({ type: '', text: '' });

    // Password state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

    const [avatarLoading, setAvatarLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Sync local state
    useEffect(() => {
        if (userName && !fullName) {
            setFullName(userName);
        }
    }, [userName]);

    const handleSaveName = async () => {
        if (!fullName.trim() || fullName === userName) return;
        
        setNameLoading(true);
        setNameMsg({ type: '', text: '' });

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName.trim() })
                .eq('id', userId);

            if (error) throw error;

            setUserName(fullName.trim());
            setUserInitial(fullName.trim().charAt(0).toUpperCase());
            setNameMsg({ type: 'success', text: 'Display name updated successfully!' });
            
            setTimeout(() => setNameMsg({ type: '', text: '' }), 3000);
        } catch (err) {
            setNameMsg({ type: 'error', text: 'Update failed: ' + err.message });
        } finally {
            setNameLoading(false);
        }
    };

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

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            setPwMsg({ type: 'success', text: 'Password updated. Sign-out required.' });
            
            setTimeout(async () => {
                await supabase.auth.signOut({ scope: 'global' });
                navigate('/portal/admin/login');
            }, 2500);
        } catch (err) {
            setPwMsg({ type: 'error', text: 'Error: ' + err.message });
            setPwLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be under 2MB.');
            return;
        }

        setAvatarLoading(true);
        try {
            const ext = file.name.split('.').pop();
            const filePath = `avatars/${userId}_${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);
            
            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setAvatarLoading(false);
        }
    };

    if (profileLoading && !userName) {
        return (
            <div className="ap-content">
                <div className="ap-inner-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                    <Loader2 className="ap-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="ap-content">
            <div className="ap-inner-wrap">
                <h1 className="ap-page-title">My Profile</h1>

                <div className="ap-layout">
                    {/* Avatar Column (Left) */}
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
                                {avatarLoading ? <Loader2 size={12} className="ap-spin" /> : <Camera size={12} />}
                            </label>
                        </div>
                        <div className="ap-avatar-name">{userName}</div>
                        <div className="ap-avatar-role">
                            <Shield size={10} style={{ marginRight: '4px' }} />
                            {userRole?.toUpperCase() || 'ADMINISTRATOR'}
                        </div>
                        <div className="ap-avatar-hint">Click the camera icon to upload a new photo. Max size 2MB.</div>
                    </div>

                    {/* Form Column (Right - Split in two) */}
                    <div className="ap-form-column">
                        {/* Name Card */}
                        <div className="ap-card">
                            <div className="ap-card-title">Personal Information</div>
                            <div className="ap-card-subtitle">Update your account display name</div>
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
                                <button className="ap-btn-primary" onClick={handleSaveName} disabled={nameLoading || fullName === userName}>
                                    {nameLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        {/* Vertical Divider */}
                        <div className="ap-col-divider" />

                        {/* Password Card */}
                        <div className="ap-card">
                            <div className="ap-card-title">Security & Privacy</div>
                            <div className="ap-card-subtitle">Update your access credentials</div>
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
                                    placeholder="Min. 8 characters"
                                    autoComplete="new-password"
                                />
                                <div className="ap-password-rules">Ensure your password is at least 8 characters long for security.</div>
                            </div>

                            <div className="ap-form-group">
                                <label className="ap-label">Confirm Password</label>
                                <input
                                    type="password"
                                    className="ap-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat new password"
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
