import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { activeSession, activeTerm } = useOutletContext();
    const [stats, setStats] = useState({
        students: 0,
        subjects: 0,
        questions: 0,
        testResults: 0,
        examResults: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!activeSession) return;
            setLoading(true);
            try {
                // Fetch Metrics (Session Filtered where applicable)
                const [
                    { count: studentCount },
                    { count: subjectCount },
                    { count: questionCount },
                    { count: testResultCount },
                    { count: examResultCount }
                ] = await Promise.all([
                    supabase.from('students').select('*', { count: 'exact', head: true }),
                    supabase.from('subjects').select('*', { count: 'exact', head: true }),
                    supabase.from('questions').select('*', { count: 'exact', head: true })
                        .eq('session_id', activeSession)
                        .eq('term_id', activeTerm),
                    supabase.from('exam_results').select('*', { count: 'exact', head: true })
                        .eq('session_id', activeSession)
                        .eq('term_id', activeTerm)
                        .eq('question_type', 'test'),
                    supabase.from('exam_results').select('*', { count: 'exact', head: true })
                        .eq('session_id', activeSession)
                        .eq('term_id', activeTerm)
                        .eq('question_type', 'exam')
                ]);

                setStats({
                    students: studentCount || 0,
                    subjects: subjectCount || 0,
                    questions: questionCount || 0,
                    testResults: testResultCount || 0,
                    examResults: examResultCount || 0
                });
            } catch (err) {
                console.error("Dashboard metric error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [activeSession, activeTerm]);

    return (
        <div className="ad-wrapper">
            {/* Banner Section */}
            <section className="ad-banner">
                <div className="ad-banner-overlay"></div>
                <div className="ad-banner-content">
                    <h1>Welcome Back Admin,</h1>
                    <p>
                        Current Session: <span style={{ color: '#fff', fontWeight: 'bold' }}>{activeSession} {activeTerm} Session</span>
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
        </div>
    );
};

export default AdminDashboard;
