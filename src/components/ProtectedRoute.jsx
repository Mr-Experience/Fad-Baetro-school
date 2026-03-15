import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LoadingOverlay from './LoadingOverlay';

const getRoleCacheKey = (role) => `fad_mastro_verified_role_${role}`;

const ProtectedRoute = ({ requiredRole = 'admin' }) => {
    // Check cache immediately to prevent initial flicker
    const getInitialAuth = () => {
        const cached = localStorage.getItem(getRoleCacheKey(requiredRole));
        if (!cached) return null;
        try {
            const parsed = JSON.parse(cached);
            const dbRole = (parsed.role || '').toLowerCase().trim();
            const targetRole = requiredRole.toLowerCase().trim();
            
            // Hierarchy Check: super_admin can access admin routes
            if (targetRole === 'admin') {
                return (dbRole === 'admin' || dbRole === 'super_admin' || dbRole === 'super-admin');
            }
            
            if (targetRole === 'super_admin') {
                return (dbRole === 'super_admin' || dbRole === 'super-admin');
            }
            return dbRole === targetRole;
        } catch { return null; }
    };

    const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuth());
    const [hasCheckedOnce, setHasCheckedOnce] = useState(getInitialAuth() !== null);
    const location = useLocation();
    const verificationInProgressRef = React.useRef(false);

    useEffect(() => {
        let isMounted = true;
        
        const verifyAccess = async (session) => {
            if (!isMounted || verificationInProgressRef.current) return;
            verificationInProgressRef.current = true;

            if (!session) {
                setIsAuthenticated(false);
                setHasCheckedOnce(true);
                verificationInProgressRef.current = false;
                return;
            }

            try {
                // If we already know we're authenticated for this role, skip the DB hit
                if (isAuthenticated === true && hasCheckedOnce) {
                    verificationInProgressRef.current = false;
                    return;
                }

                // Race a 10s timeout (increased for reliability)
                const profilePromise = supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .maybeSingle();

                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Verification Timeout')), 10000)
                );

                const { data: profile, error: profileError } = await Promise.race([
                    profilePromise,
                    timeoutPromise
                ]);

                if (profileError) throw profileError;

                if (!profile) {
                    setIsAuthenticated(false);
                    localStorage.removeItem(getRoleCacheKey(requiredRole));
                } else {
                    const dbRole = (profile.role || '').toLowerCase().trim();
                    const targetRole = requiredRole.toLowerCase().trim();
                    
                    let isMatch = false;
                    if (targetRole === 'admin') {
                        isMatch = (dbRole === 'admin' || dbRole === 'super_admin' || dbRole === 'super-admin');
                    } else if (targetRole === 'super_admin') {
                        isMatch = (dbRole === 'super_admin' || dbRole === 'super-admin');
                    } else {
                        isMatch = (dbRole === targetRole);
                    }
                    
                    setIsAuthenticated(isMatch);
                    if (isMatch) {
                        localStorage.setItem(getRoleCacheKey(requiredRole), JSON.stringify({
                            role: dbRole,
                            userId: session.user.id,
                            timestamp: Date.now()
                        }));
                    }
                }
            } catch (err) {
                console.error("Auth verification failed or timed out:", err);
                setIsAuthenticated(false);
            } finally {
                if (isMounted) setHasCheckedOnce(true);
                verificationInProgressRef.current = false;
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                if (isMounted) {
                    localStorage.removeItem(getRoleCacheKey(requiredRole));
                    setIsAuthenticated(false);
                    setHasCheckedOnce(true);
                }
            } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                // Only re-verify on major events, not every token refresh
                if (session) await verifyAccess(session);
            }
        });

        // Initial check only if not cached
        if (isAuthenticated === null) {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    verifyAccess(session);
                } else {
                    // Give it a tiny bit of extra time to see if identity is recovered
                    // Recovery check: give it a bit more time if network is slow
                    setTimeout(() => {
                        if (isMounted && isAuthenticated === null) {
                            setIsAuthenticated(false);
                            setHasCheckedOnce(true);
                        }
                    }, 4000); // Increased buffer to prevent false-negative redirects on slow networks
                }
            });
        }

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [requiredRole]);

    // Only show the blocking overlay on the very first check
    if (isAuthenticated === null && !hasCheckedOnce) {
        return <LoadingOverlay isVisible={true} />;
    }

    if (isAuthenticated === false) {
        // Redirect logic
        let redirectPath = "/portal/admin/login";
        if (requiredRole === 'super_admin') redirectPath = "/portal/superadmin";
        if (requiredRole === 'student') redirectPath = "/portal/student";
        if (requiredRole === 'candidate') redirectPath = "/portal/candidate";

        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    // Default to rendering children (sticky)
    return <Outlet />;
};

export default ProtectedRoute;
