import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LoadingOverlay from './LoadingOverlay';

const ProtectedRoute = ({ requiredRole = 'admin' }) => {
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
                authTimeout = setTimeout(() => {
                    setAuthStatus(false);
                }, 50); // Reduced delay to prevent loading hang
                return;
            }

            if (authTimeout) clearTimeout(authTimeout);

            try {
                // Determine if we need to check the 'students' table or 'profiles' table
                if (requiredRole === 'student') {
                    const { data: student, error: studentError } = await supabase
                        .from('students')
                        .select('id')
                        .eq('email', session.user.email.toLowerCase())
                        .maybeSingle();

                    if (studentError || !student) {
                        console.warn("User is not a student. Denying entry.");
                        setAuthStatus(false);
                    } else {
                        setAuthStatus(true);
                    }
                    return;
                }

                // Default check for 'admin' or 'super_admin' in profiles table
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Timeout checking ${requiredRole} role`)), 10000)
                );

                const fetchProfilePromise = supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                const { data: profile, error } = await Promise.race([fetchProfilePromise, timeoutPromise]);

                if (error) {
                    console.error("Error fetching profile role:", error);
                    setAuthStatus(false);
                    return;
                }

                if (profile) {
                    if (requiredRole === 'super_admin' && profile.role === 'super_admin') {
                        setAuthStatus(true);
                    } else if (requiredRole === 'admin' && (profile.role === 'admin' || profile.role === 'super_admin')) {
                        setAuthStatus(true);
                    } else if (requiredRole === 'candidate' && profile.role === 'candidate') {
                        setAuthStatus(true);
                    } else if (requiredRole === 'student' && profile.role === 'student') {
                        // Allow students if they have the role in profiles
                        setAuthStatus(true);
                    } else {
                        console.warn(`User role '${profile.role}' does not match required role '${requiredRole}'. Denying entry.`);
                        setAuthStatus(false);
                    }
                } else {
                    setAuthStatus(false);
                }
            } catch (err) {
                console.error("Auth verification error:", err);
                setAuthStatus(false);
            }
        };

        const initAuth = async () => {
            try {
                // First attempt
                let { data: { session }, error } = await supabase.auth.getSession();

                // If no session, wait a bit and try again (tab sync race condition)
                if (!session && !error) {
                    await new Promise(resolve => setTimeout(resolve, 50)); // reduced from 800ms
                    const secondCheck = await supabase.auth.getSession();
                    session = secondCheck.data.session;
                }

                if (error) throw error;
                await verifyAccess(session);
            } catch (err) {
                console.error("Session error:", err);
                setAuthStatus(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
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
    }, [requiredRole]);

    if (isAuthenticated === null) {
        return <LoadingOverlay isVisible={true} />;
    }

    if (!isAuthenticated) {
        // Redirect logic
        let redirectPath = "/portal/admin/login";
        if (requiredRole === 'super_admin') redirectPath = "/portal/superadmin";
        if (requiredRole === 'student') redirectPath = "/portal/student";
        if (requiredRole === 'candidate') redirectPath = "/portal/candidate";

        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
