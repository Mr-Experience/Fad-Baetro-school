import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { UserX, Trash2 } from 'lucide-react';
import './AdminCandidates.css';

const AdminCandidates = () => {
    const { classes, candidatesCache, refreshAdminData } = useOutletContext();
    const [candidates, setCandidates] = useState(candidatesCache || []);
    const [loading, setLoading] = useState(!candidatesCache);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        if (candidatesCache) {
            setCandidates(candidatesCache);
            setLoading(false);
            refreshAdminData().catch(() => {});
        } else {
            setLoading(true);
            refreshAdminData().finally(() => setLoading(false));
        }
    }, [candidatesCache]);



    const handleUpdateStatus = async (id, status) => {
        try {
            const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
            if (error) throw error;
            // Optimistic update
            setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
            refreshAdminData().catch(() => {});
        } catch (err) {
            alert("Failed to update status: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this candidate? This action is permanent.")) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            // Optimistic update
            setCandidates(prev => prev.filter(c => c.id !== id));
            refreshAdminData().catch(() => {});
        } catch (err) {
            alert("Failed to delete candidate: " + err.message);
        }
    };

    const handleDeactivateCandidate = async (candidate) => {
        if (!window.confirm(`Are you sure you want to deactivate candidate portal access for ${candidate.full_name}? They will no longer be able to login to the admission portal.`)) return;

        try {
            if (candidate.status === 'deactivated') {
                alert("Already deactivated.");
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .update({ status: 'deactivated' })
                .eq('id', candidate.id);

            if (error) throw error;

            // Optimistic update
            setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, status: 'deactivated' } : c));
            refreshAdminData().catch(() => {});
            alert(`${candidate.full_name}'s candidate portal access has been deactivated successfully.`);
        } catch (err) {
            console.error("Deactivation error:", err);
            alert("Error deactivating candidate: " + err.message);
        }
    };

    const filteredCandidates = candidates.filter(c => {
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        return matchesStatus;
    });

    return (
        <div className="ac-container">
            <div className="ac-card">
                <div className="ac-header">
                    <h1 className="ac-title">Admission / Candidates</h1>
                    <div className="ac-controls">
                        <select
                            className="ac-dropdown"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="ac-table-wrapper">
                    <table className="ac-table">
                        <thead>
                            <tr>
                                <th>Candidate Name</th>
                                <th>Email</th>
                                <th>Applied Class</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Admission Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="ac-empty-state">Loading candidates...</td></tr>
                            ) : filteredCandidates.length > 0 ? (
                                filteredCandidates.map(c => (
                                    <tr key={c.id}>
                                        <td className="ac-student-name">{c.full_name}</td>
                                        <td className="ac-student-email">{c.email}</td>
                                        <td><span className="ac-badge-class">{c.classes?.class_name || 'N/A'}</span></td>
                                        <td>{c.phone_number || '-'}</td>
                                        <td>
                                            <span className={`ac-status-badge ${c.status}`}>
                                                {c.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="ac-actions">
                                                {c.status !== 'deactivated' ? (
                                                    <button
                                                        className="ac-action-btn deactivate"
                                                        title="Deactivate Portal Access"
                                                        onClick={() => handleDeactivateCandidate(c)}
                                                    >
                                                        <UserX size={18} />
                                                    </button>
                                                ) : (
                                                    <span className="ac-deactivated-label">Deactivated</span>
                                                )}
                                                <button className="ac-action-btn delete" title="Delete" onClick={() => handleDelete(c.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="ac-empty-state">
                                        <div className="ac-empty-icon">📝</div>
                                        <p>No admission applications found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminCandidates;
