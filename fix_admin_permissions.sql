-- FINAL FIX: Comprehensive Admin Permissions
-- Run this in Supabase SQL Editor to resolve all RLS issues for Admins

-- 1. STRENGTHEN PROFILES POLICIES
-- We need to ensure the executor's role is checked for every action (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admin Restricted Access" ON public.profiles;
DROP POLICY IF EXISTS "Super Admin Master Access" ON public.profiles;
DROP POLICY IF EXISTS "Users browse profiles" ON public.profiles;

-- Anyone authenticated can Browse profiles (names/roles)
CREATE POLICY "Profiles - authenticated select" ON public.profiles
    FOR SELECT TO authenticated USING (true);

-- Admins can Manage (All actions) profiles IF they are students or candidates
CREATE POLICY "Profiles - admin manage students" ON public.profiles
    FOR ALL TO authenticated
    USING (
        public.check_is_admin() OR public.check_is_super_admin()
    )
    WITH CHECK (
        (public.check_is_admin() AND role IN ('student', 'candidate'))
        OR public.check_is_super_admin()
    );

-- 2. STRENGTHEN STORAGE POLICIES
-- Storage RLS is often the culprit for "violates row-level security policy" during uploads
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        
        -- Clean slate for avatar storage
        DROP POLICY IF EXISTS "Admins manage avatars" ON storage.objects;
        DROP POLICY IF EXISTS "Admins full access to avatars" ON storage.objects;
        DROP POLICY IF EXISTS "Super Admin full access to avatars" ON storage.objects;
        DROP POLICY IF EXISTS "Public view avatars" ON storage.objects;

        -- READ: Public access for avatars
        CREATE POLICY "Avatars - public read" ON storage.objects
            FOR SELECT USING (bucket_id = 'avatars');

        -- WRITE: Admin/Super Admin access
        -- Crucial: (public.check_is_admin() OR public.check_is_super_admin()) must be in BOTH USING and WITH CHECK
        CREATE POLICY "Avatars - admin manage" ON storage.objects
            FOR ALL TO authenticated
            USING (
                bucket_id = 'avatars' AND 
                (public.check_is_admin() OR public.check_is_super_admin())
            )
            WITH CHECK (
                bucket_id = 'avatars' AND 
                (public.check_is_admin() OR public.check_is_super_admin())
            );

        -- website_image bucket cleanup
        DROP POLICY IF EXISTS "Admins Full Access to Website Images" ON storage.objects;
        DROP POLICY IF EXISTS "Admins Full Access" ON storage.objects;

        CREATE POLICY "Website - admin manage" ON storage.objects
            FOR ALL TO authenticated
            USING (
                bucket_id = 'website_image' AND 
                (public.check_is_admin() OR public.check_is_super_admin())
            )
            WITH CHECK (
                bucket_id = 'website_image' AND 
                (public.check_is_admin() OR public.check_is_super_admin())
            );

    END IF;
END $$;

-- 3. ENSURE SYSTEM SETTINGS ACCESSIBILITY
DROP POLICY IF EXISTS "Super admin manage settings" ON public.system_settings;
CREATE POLICY "Settings - admin manage" ON public.system_settings
    FOR ALL TO authenticated
    USING (public.check_is_admin() OR public.check_is_super_admin())
    WITH CHECK (public.check_is_admin() OR public.check_is_super_admin());
