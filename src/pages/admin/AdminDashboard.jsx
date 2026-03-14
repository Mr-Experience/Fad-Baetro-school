import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Users, UserCheck, BookOpen, BarChart3, Clock, ArrowRight } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { activeSession, activeTerm, dashboardStats, setDashboardStats, refreshAdminData } = useOutletContext();
    const navigate = useNavigate();
    const [stats, setStats] = useState(dashboardStats || {
        students: 0,
        subjects: 0,
        questions: 0,
        testResults: 0,
        examResults: 0
    });
    const [recentSubmissions, setRecentSubmissions] = useState([]);
    const [loading, setLoading] = useState(!dashboardStats);

    useEffect(() => {
        const fetchDashboardData = async () => {
            // 1. Instant UI Feedback (Use cached stats if available)
            if (dashboardStats) {
                setStats(dashboardStats);
                setLoading(false);
            }
            
            if (activeSession === null || activeTerm === null) return;
            
            // 2. Mandatory Background Fetch ("Always Fetch" requirement)
            try {
                // Fetch Metrics and Recent Submissions
                const [
                    { count: studentCount },
                    { count: subjectCount },
                    { count: questionCount },
                    { count: testResultCount },
                    { count: examResultCount },
                    recentRes
                ] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
                    supabase.from('subjects').select('*', { count: 'exact', head: true }),
                    supabase.from('questions').select('*', { count: 'exact', head: true })
                        .eq('session_id', activeSession)
                        .eq('term_id', activeTerm),
                    supabase.from('exam_results').select('*', { count: 'exact', head: true })
                        .eq('session_id', (activeSession || '').trim())
                        .eq('term_id', (activeTerm || '').trim())
                        .eq('question_type', 'test'),
                    supabase.from('exam_results').select('*', { count: 'exact', head: true })
                        .eq('session_id', (activeSession || '').trim())
                        .eq('term_id', (activeTerm || '').trim())
                        .eq('question_type', 'exam'),
                    supabase.from('exam_results')
                        .select('*, profiles(full_name), subjects(subject_name)')
                        .order('submitted_at', { ascending: false })
                        .limit(5)
                ]);

                const newStats = {
                    students: studentCount || 0,
                    subjects: subjectCount || 0,
                    questions: questionCount || 0,
                    testResults: testResultCount || 0,
                    examResults: examResultCount || 0
                };

                setStats(newStats);
                setDashboardStats(newStats);
                if (recentRes.data) setRecentSubmissions(recentRes.data);

                // Silently refresh other layout data too
                refreshAdminData().catch(() => {});

            } catch (err) {
                console.error("Dashboard metric error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        // Remove dashboardStats from dependencies to prevent unintended loops
        // while ensuring it always fetches on mount or session change.
    }, [activeSession, activeTerm, setDashboardStats, refreshAdminData]);

    return (
        <div className="ad-wrapper">
            {/* Banner Section */}
            <section className="ad-banner">
                <div className="ad-banner-overlay"></div>
                <div className="ad-banner-content">
                    <h1>Welcome Back Admin,</h1>
                    <p>
                        Current Session: <span style={{ color: '#fff', fontWeight: 'bold' }}>{activeSession ? `${activeSession} ${activeTerm}` : 'Loading Session...'}</span>
                    </p>
                </div>
            </section>

            {/* Overview Section */}
            <section className="ad-content-grid">
                <div className="ad-overview-card">
                    <div className="ad-card-header">
                        <h2>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9D245A" strokeWidth="2.5">
                                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                            </svg>
                            Platform Overview
                        </h2>
                        <div className="ad-trend">Live Overview</div>
                    </div>

                    <div className="ad-stats-grid">
                        <div className="ad-stat-item">
                            <span className="ad-stat-label">Total Students</span>
                            <div className="ad-stat-value-row">
                                <span className="ad-stat-number">{loading ? '...' : stats.students}</span>
                            </div>
                        </div>

                        <div className="ad-stat-item">
                            <span className="ad-stat-label">Active Subjects</span>
                            <div className="ad-stat-value-row">
                                <span className="ad-stat-number">{loading ? '...' : stats.subjects}</span>
                            </div>
                        </div>

                        <div className="ad-stat-item">
                            <span className="ad-stat-label">Questions (Current)</span>
                            <div className="ad-stat-value-row">
                                <span className="ad-stat-number">{loading ? '...' : stats.questions}</span>
                            </div>
                        </div>

                        <div className="ad-stat-item">
                            <span className="ad-stat-label">Test Submissions</span>
                            <div className="ad-stat-value-row">
                                <span className="ad-stat-number">{loading ? '...' : stats.testResults}</span>
                            </div>
                        </div>

                        <div className="ad-stat-item">
                            <span className="ad-stat-label">Exam Submissions</span>
                            <div className="ad-stat-value-row">
                                <span className="ad-stat-number">{loading ? '...' : stats.examResults}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Actions Grid */}
            <section className="ad-content-grid" style={{ marginTop: '20px' }}>
                <div className="ad-quick-links">
                    <div className="ad-link-card student" onClick={() => navigate('/portal/admin/students')}>
                        <div className="ad-link-icon"><Users size={24} /></div>
                        <div className="ad-link-text">
                            <h3>Students</h3>
                            <p>Manage school enrollment</p>
                        </div>
                        <ArrowRight className="ad-link-arrow" size={18} />
                    </div>

                    <div className="ad-link-card candidate" onClick={() => navigate('/portal/admin/candidates')}>
                        <div className="ad-link-icon"><UserCheck size={24} /></div>
                        <div className="ad-link-text">
                            <h3>Candidates</h3>
                            <p>Entrance exam applicants</p>
                        </div>
                        <ArrowRight className="ad-link-arrow" size={18} />
                    </div>

                    <div className="ad-link-card exam" onClick={() => navigate('/portal/admin/questions')}>
                        <div className="ad-link-icon"><BookOpen size={24} /></div>
                        <div className="ad-link-text">
                            <h3>Exams</h3>
                            <p>Configure question papers</p>
                        </div>
                        <ArrowRight className="ad-link-arrow" size={18} />
                    </div>

                    <div className="ad-link-card result" onClick={() => navigate('/portal/admin/results')}>
                        <div className="ad-link-icon"><BarChart3 size={24} /></div>
                        <div className="ad-link-text">
                            <h3>Results</h3>
                            <p>Analyze performance data</p>
                        </div>
                        <ArrowRight className="ad-link-arrow" size={18} />
                    </div>
                </div>
            </section>

            {/* Bottom Details Section */}
            <section className="ad-content-grid" style={{ marginTop: '20px', marginBottom: '40px' }}>
                <div className="ad-bottom-layout">
                    {/* Recent Submissions */}
                    <div className="ad-bottom-card recent-activity">
                        <div className="ad-card-header">
                            <h2><Clock size={18} /> Recent Submissions</h2>
                        </div>
                        <div className="ad-activity-list">
                            {recentSubmissions.length === 0 ? (
                                <p className="ad-no-data">No recent activity found.</p>
                            ) : (
                                recentSubmissions.map(res => (
                                    <div key={res.id} className="ad-activity-item">
                                        <div className="ad-activity-info">
                                            <span className="ad-activity-name">{res.profiles?.full_name}</span>
                                            <span className="ad-activity-meta">{res.subjects?.subject_name} • {res.question_type}</span>
                                        </div>
                                        <div className="ad-activity-score pass">
                                            {res.score_percent}%
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* System Info / Distribution */}
                    <div className="ad-bottom-card system-health">
                        <div className="ad-card-header">
                            <h2>Database Tracking</h2>
                        </div>
                        <div className="ad-health-stats">
                            <div className="ad-health-item">
                                <span>Security Level</span>
                                <div className="ad-health-bar"><div className="ad-health-fill" style={{ width: '100%', background: '#10B981' }}></div></div>
                            </div>
                            <div className="ad-health-item">
                                <span>Active Session Sync</span>
                                <div className="ad-health-bar"><div className="ad-health-fill" style={{ width: '92%', background: '#3B82F6' }}></div></div>
                            </div>
                            <div className="ad-health-item">
                                <span>Storage Utilization ({((0.532 / 1000) * 100).toFixed(2)}%)</span>
                                <div className="ad-health-bar"><div className="ad-health-fill" style={{ width: '1%', background: '#9D245A' }}></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;
