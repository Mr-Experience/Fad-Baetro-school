import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { UserCheck, Trash2 } from 'lucide-react';
import './AdminCandidates.css';

const AdminCandidates = () => {
    const { userId } = useOutletContext();
    const [candidates, setCandidates] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchCandidates();
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('*');
        if (data) setClasses(data);
    };

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('candidates')
                .select(`
                    *,
                    classes (class_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setCandidates(data);
        } catch (err) {
            console.error("Error fetching candidates:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        const { error } = await supabase.from('candidates').update({ status }).eq('id', id);
        if (!error) fetchCandidates();
    };

    const handleConvertToStudent = async (candidate) => {
        if (!window.confirm(`Are you sure you want to promote and start the class for ${candidate.full_name}?`)) return;

        try {
            // Check if already converted
            if (candidate.converted_to_student) {
                alert("Already converted.");
                return;
            }

            // 1. Update Profile to be a student
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    role: 'student',
                    class_id: candidate.class_id,
                    phone_number: candidate.phone_number
                })
                .eq('id', candidate.id);

            if (profileError) throw profileError;

            // 3. Mark candidate as converted and clear status
            const { error: candidateUpdateError } = await supabase.from('candidates').update({
                converted_to_student: true,
                student_id: candidate.id,
                status: 'approved'
            }).eq('id', candidate.id);

            if (candidateUpdateError) throw candidateUpdateError;

            alert(`${candidate.full_name} has been moved to the student portal successfully! They can now login with their ${candidate.email} account.`);
            fetchCandidates();
        } catch (err) {
            console.error("Conversion error:", err);
            alert("Error converting candidate: " + err.message);
        }
    };

    const filteredCandidates = filterStatus === 'all'
        ? candidates
        : candidates.filter(c => c.status === filterStatus);

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
                                                {!c.converted_to_student ? (
                                                    <button
                                                        className="ac-action-btn promote"
                                                        title="Promote and Start Class"
                                                        onClick={() => handleConvertToStudent(c)}
                                                    >
                                                        <UserCheck size={18} />
                                                    </button>
                                                ) : (
                                                    <span className="ac-converted-label">Converted</span>
                                                )}
                                                <button className="ac-action-btn delete" title="Delete">
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
