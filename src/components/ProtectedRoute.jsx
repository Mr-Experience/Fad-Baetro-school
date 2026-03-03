import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LoadingOverlay from './LoadingOverlay';

const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const location = useLocation();

    useEffect(() => {
        let isChecking = true;
        let authTimeout; // Timeout for debouncing "not logged in" state

        const setAuthStatus = (status) => {
            if (isChecking) setIsAuthenticated(status);
        };

        const verifyAccess = async (session) => {
            if (!session) {
                // If there's no session, wait a brief moment. Supabase sometimes restores
                // the session asynchronously immediately after mount.
                authTimeout = setTimeout(() => {
                    setAuthStatus(false);
                }, 1000);
                return;
            }

            // Clear any pending false status if we found a session
            if (authTimeout) clearTimeout(authTimeout);

            try {
                // Set a timeout to prevent infinite loading if DB hangs
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout checking Admin role")), 5000)
                );

                const fetchProfilePromise = supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                const { data: profile, error } = await Promise.race([fetchProfilePromise, timeoutPromise]);

                if (error) {
                    console.error("Error fetching profile role:", error);
                    // Force false if network fails or role doesn't exist
                    setAuthStatus(false);
                    return;
                }

                if (profile && profile.role === 'admin') {
                    setAuthStatus(true);
                } else {
                    console.warn("User is not an admin, denying entry.");
                    setAuthStatus(false);
                    await supabase.auth.signOut();
                }
            } catch (err) {
                console.error("Auth verification error:", err);
                setAuthStatus(false);
            }
        };

        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                await verifyAccess(session);
            } catch (err) {
                console.error("Session error:", err);
                setAuthStatus(false);
            }
        };

        // Run initial check
        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth event:", event);
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                if (authTimeout) clearTimeout(authTimeout);
                await verifyAccess(session);
            } else if (event === 'SIGNED_OUT') {
                setAuthStatus(false);
            }
        });

        return () => {
            isChecking = false;
            if (authTimeout) clearTimeout(authTimeout);
            subscription.unsubscribe();
        };
    }, []);

    if (isAuthenticated === null) {
        // Still checking auth state
        return <LoadingOverlay isVisible={true} />;
    }

    if (!isAuthenticated) {
        // Redirect to admin login if not authenticated
        // Add state so we can redirect back after successful login if needed later
        return <Navigate to="/portal/admin/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
