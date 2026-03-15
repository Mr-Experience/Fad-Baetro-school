import { createBrowserClient } from "@supabase/ssr";
import { createClient as supabaseCreateClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nvbsgzintqxsjcptujld.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YnNnemludHF4c2pjcHR1amxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTczNDYsImV4cCI6MjA4OTA3MzM0Nn0.Zc1uHjqD4AIzYQ5pPHyU4dIDPPq2jUnw_TzLNhcZHMI';

// --- AUTH SESSION ISOLATION LOGIC ---
// This ensures that navigating between portals doesn't cause session "leaks" or overwrites
const getPortalStorageKey = () => {
    const path = window.location.pathname;
    if (path.includes('/portal/superadmin')) return 'fad_superadmin_auth_token';
    if (path.includes('/portal/admin')) return 'fad_admin_auth_token';
    if (path.includes('/portal/student')) return 'fad_student_auth_token';
    if (path.includes('/portal/candidate')) return 'fad_candidate_auth_token';
    return 'fad_default_auth_token';
};

// Dynamic Storage Proxy
const dynamicPortalStorage = {
    getItem: (key) => {
        const portalPrefix = getPortalStorageKey(); 
        return window.localStorage.getItem(`${portalPrefix}_${key}`);
    },
    setItem: (key, value) => {
        const portalPrefix = getPortalStorageKey();
        window.localStorage.setItem(`${portalPrefix}_${key}`, value);
    },
    removeItem: (key) => {
        const portalPrefix = getPortalStorageKey();
        window.localStorage.removeItem(`${portalPrefix}_${key}`);
    }
};

// Global singleton client
export const supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            storage: dynamicPortalStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);

// Properly export createClient to allow NEW instances (for user creation without logout)
export const createClient = (url, key, options) => {
    // If options.auth.storageKey is not provided, use a default to avoid conflicts
    const finalOptions = {
        ...options,
        auth: {
            ...options?.auth,
            storageKey: options?.auth?.storageKey || 'temp-isolated-key'
        }
    };
    return supabaseCreateClient(url || supabaseUrl, key || supabaseAnonKey, finalOptions);
};
