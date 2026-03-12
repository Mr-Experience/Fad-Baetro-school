import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LoadingOverlay from './LoadingOverlay';

const ProtectedRoute = ({ requiredRole = 'admin' }) => {
    // Start as null only on first mount
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [hasCheckedOnce, setHasCheckedOnce] = useState(false);
    const location = useLocation();

    useEffect(() => {
        let isMounted = true;
        let authSubscription = null;

        const verifyAccess = async (session) => {
            if (!session) {
                if (isMounted) setIsAuthenticated(false);
                return;
            }

            try {
                // Determine if we need to check the 'students' table or 'profiles' table
                if (requiredRole === 'student') {
                    const { data: student, error: studentError } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('email', session.user.email.toLowerCase())
                        .maybeSingle();

                    if (isMounted) setIsAuthenticated(!(studentError || !student));
                    return;
                }

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (!profile) {
                    // No profile found = account likely deleted
                    if (isMounted) setIsAuthenticated(false);
                    return;
                }

                let isMatch = false;
                if (requiredRole === 'super_admin' && (profile.role === 'super_admin' || profile.role === 'super-admin')) {
                    isMatch = true;
                } else if (requiredRole === 'admin' && profile.role === 'admin') {
                    isMatch = true;
                } else if (requiredRole === 'candidate' && profile.role === 'candidate') {
                    isMatch = true;
                } else if (requiredRole === 'student' && profile.role === 'student') {
                    isMatch = true;
                }

                if (isMounted) setIsAuthenticated(isMatch);
            } catch (err) {
                console.error("Auth verification error:", err);
                // Sticky behavior: don't flip to false on generic catch errors if already true
                if (!isAuthenticated && isMounted) setIsAuthenticated(false);
            } finally {
                if (isMounted) setHasCheckedOnce(true);
            }
        };

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                await verifyAccess(session);
            } catch (err) {
                if (isMounted) setIsAuthenticated(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await verifyAccess(session);
            } else if (event === 'SIGNED_OUT') {
                if (isMounted) setIsAuthenticated(false);
            }
        });
        authSubscription = subscription;

        return () => {
            isMounted = false;
            if (authSubscription) authSubscription.unsubscribe();
        };
    }, [requiredRole]); // Stays stable unless the route's fundamental role requirement changes

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
