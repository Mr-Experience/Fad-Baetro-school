import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminHeader from './AdminHeader';
import './AdminLayout.css';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // User Profile state
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    const [userId, setUserId] = useState('');
    const [userInitial, setUserInitial] = useState('A');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [activeSession, setActiveSession] = useState(null);
    const [activeTerm, setActiveTerm] = useState(null);

    // Dashboard Stats Cache (to prevent flicker)
    const [dashboardStats, setDashboardStats] = useState(null);
    const [studentsCache, setStudentsCache] = useState(null);
    const [subjectsCache, setSubjectsCache] = useState({}); // { classId: [subjects] }
    const [eventsCache, setEventsCache] = useState(null);
    const [candidatesCache, setCandidatesCache] = useState(null);
    const [infoCache, setInfoCache] = useState(null);
    const [questionSummaryCache, setQuestionSummaryCache] = useState(null); // { [classId]: summaryData }
    const [resultsSummaryCache, setResultsSummaryCache] = useState(null); // { [classId]: summaryData }
 // { [classId]: summaryData }

    // Classes cache
    const [classes, setClasses] = useState([]);
    const [classesLoading, setClassesLoading] = useState(true);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/portal/admin/login');
    };

    const fetchInitialData = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            setUserId(user.id);
            
            // --- OMNI-FETCH (All Tabs Data Up Front) ---
            // Safer fetching: One failing request won't block the whole portal
            const [
                profileRes, 
                settingsRes, 
                classesRes,
                studentsRes,
                candidatesRes,
                subjectsRes,
                postsRes,
                heroRes,
                mediaRes
            ] = await Promise.all([
                supabase.from('profiles').select('full_name, avatar_url, role').eq('id', user.id).maybeSingle(),
                supabase.from('system_settings').select('current_session, current_term').eq('id', 1).maybeSingle(),
                supabase.from('classes').select('*').order('class_name'),
                supabase.from('profiles').select('*, classes(class_name)').eq('role', 'student').order('full_name'),
                supabase.from('profiles').select('*, classes(class_name)').eq('role', 'candidate').order('created_at', { ascending: false }),
                supabase.from('subjects').select('*, classes(class_name)').order('subject_name'),
                supabase.from('system_posts').select('*').order('created_at', { ascending: false }),
                supabase.from('hero_images').select('*').order('display_order', { ascending: true }),
                supabase.from('media_items').select('*').order('created_at', { ascending: false })
            ]);

            // 1. Profile & Session
            if (profileRes.data) {
                setUserName(profileRes.data.full_name);
                setUserRole(profileRes.data.role);
                setUserInitial(profileRes.data.full_name?.charAt(0) || 'A');
                setAvatarUrl(profileRes.data.avatar_url);
            }

            if (settingsRes.data) {
                setActiveSession(settingsRes.data.current_session);
                setActiveTerm(settingsRes.data.current_term);
            }

            // 2. Cache Data (Omni-Fill)
            if (classesRes.data) setClasses(classesRes.data);
            if (studentsRes.data) setStudentsCache(studentsRes.data);
            if (candidatesRes.data) setCandidatesCache(candidatesRes.data);
            if (subjectsRes.data) {
                const grouped = {};
                subjectsRes.data.forEach(s => {
                    if (!grouped[s.class_id]) grouped[s.class_id] = [];
                    grouped[s.class_id].push(s);
                });
                setSubjectsCache(grouped);
            }
            
            // Events are now handled via system_posts logic
            if (postsRes.data) {
                setEventsCache(postsRes.data.filter(p => p.post_type === 'event' || p.is_event));
            }
            
            // New Content Prefetch
            setInfoCache({
                hero: heroRes.data || [],
                media: mediaRes.data || [],
                posts: postsRes.data || [] // Added posts to infoCache structure
            });

            setClassesLoading(false);
            setProfileLoading(false);

            // 3. Realtime Subscription for System Settings (Instant Sync across all tabs)
            const settingsSubscription = supabase
                .channel('admin-settings-sync')
                .on('postgres_changes', { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'system_settings',
                    filter: 'id=eq.1'
                }, (payload) => {
                    const fresh = payload.new;
                    setActiveSession(fresh.current_session);
                    setActiveTerm(fresh.current_term);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(settingsSubscription);
            };
        } else {
            navigate('/portal/admin/login');
        }
    };

    useEffect(() => {
        fetchInitialData();

        // 1. Background Auto-Refresh (Every 2 minutes)
        const autoRefresh = setInterval(() => {
            console.log("Admin background sync active...");
            fetchInitialData();
        }, 120000);

        // 2. Focus-Sync: Re-fetch when admin switches back to this tab
        const handleFocus = () => {
            console.log("Window focus: Syncing admin state...");
            fetchInitialData();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(autoRefresh);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Proactive check on navigation is now handled efficiently by ProtectedRoute.jsx
    // Removing the redundant verifySession hit to the database on every navigation
    // which was occasionally causing flickering logouts on slow networks.

    const renderIcon = (type) => {
        switch (type) {
            case 'grid': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
            case 'info': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
            case 'user': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
            case 'users': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
            case 'questions': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
            case 'results': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
            case 'events': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
            case 'admission': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8l2 2 4-4" /></svg>;
            case 'book': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
            default: return null;
        }
    };

    const navItems = [
        { label: 'Dashboard', path: '/portal/admin', icon: 'grid' },
        { label: 'Students', path: '/portal/admin/students', icon: 'users' },
        { label: 'Subjects', path: '/portal/admin/subjects', icon: 'book' },
        { label: 'Questions', path: '/portal/admin/questions', icon: 'questions' },
        { label: 'Results', path: '/portal/admin/results', icon: 'results' },
        { label: 'Candidates', path: '/portal/admin/candidates', icon: 'admission' },
        { label: 'Events', path: '/portal/admin/events', icon: 'events' },
        { label: 'Info', path: '/portal/admin/info', icon: 'info' },
        { label: 'Profile', path: '/portal/admin/profile', icon: 'user' }
    ];


    const handleNavClick = (path) => {
        if (location.pathname !== path) {
            navigate(path);
        }
    };

    // Memoize context to prevent unnecessary child re-renders
    const contextValue = React.useMemo(() => ({
        userName,
        userRole,
        setUserName,
        userInitial,
        setUserInitial,
        avatarUrl,
        setAvatarUrl,
        profileLoading,
        userId,
        classes,
        classesLoading,
        activeSession,
        activeTerm,
        dashboardStats,
        setDashboardStats,
        studentsCache,
        setStudentsCache,
        subjectsCache,
        setSubjectsCache,
        eventsCache,
        setEventsCache,
        candidatesCache,
        setCandidatesCache,
        infoCache,
        setInfoCache,
        questionSummaryCache,
        setQuestionSummaryCache,
        resultsSummaryCache,
        setResultsSummaryCache,
        refreshAdminData: fetchInitialData
    }), [
        userName, userRole, userInitial, avatarUrl, profileLoading, userId, 
        classes, classesLoading, activeSession, activeTerm, 
        dashboardStats, studentsCache, subjectsCache, eventsCache, 
        candidatesCache, infoCache, questionSummaryCache, resultsSummaryCache, fetchInitialData
    ]);

    return (
        <div className="ad-container">
            {/* Sidebar remains mounted across admin route changes (Desktop) */}
            <aside className="ad-sidebar">
                <nav className="ad-nav">
                    {navItems.map(item => (
                        <div
                            key={item.path}
                            className={`ad-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => handleNavClick(item.path)}
                        >
                            <div className="ad-nav-icon">{renderIcon(item.icon)}</div>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>
                <div className="ad-nav-bottom">
                    <div className="ad-nav-item logout" onClick={handleLogout}>
                        <div className="ad-nav-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </div>
                        <span>Logout</span>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="ad-mobile-nav">
                {navItems.filter(item => ['Dashboard', 'Students', 'Results', 'Profile'].includes(item.label)).map(item => (
                    <div
                        key={item.path}
                        className={`ad-mn-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => handleNavClick(item.path)}
                    >
                        <div className="ad-mn-icon">{renderIcon(item.icon)}</div>
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>

            {/* Main Area */}
            <main className="ad-main">
                {/* Header remains mounted across admin route changes */}
                <AdminHeader
                    profileLoading={profileLoading}
                    userName={userName}
                    userRole={userRole}
                    userInitial={userInitial}
                    avatarUrl={avatarUrl}
                    activeSession={activeSession}
                    activeTerm={activeTerm}
                />

                {/* Individual pages render here - sharing profile context to prevent re-fetching */}
                <Outlet context={contextValue} />
            </main>
        </div>
    );
};

export default AdminLayout;
