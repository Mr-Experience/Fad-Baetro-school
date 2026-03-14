-- website_setup.sql: Fixes for website content management RLS
-- Run this in Supabase SQL Editor to resolve "new row violates row-level security policy" errors

-- 1. Create Tables if they don't exist
CREATE TABLE IF NOT EXISTS public.system_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('news', 'event')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    event_date TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hero_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.media_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.system_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Public can view posts" ON public.system_posts;
DROP POLICY IF EXISTS "Admins can manage posts" ON public.system_posts;
DROP POLICY IF EXISTS "Public can view hero" ON public.hero_images;
DROP POLICY IF EXISTS "Admins can manage hero" ON public.hero_images;
DROP POLICY IF EXISTS "Public can view media" ON public.media_items;
DROP POLICY IF EXISTS "Admins can manage media" ON public.media_items;

-- 4. Create Policies for Tables
-- system_posts
CREATE POLICY "Public can view posts" ON public.system_posts
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage posts" ON public.system_posts
    FOR ALL TO authenticated
    USING (public.check_is_admin() OR public.check_is_super_admin());

-- hero_images
CREATE POLICY "Public can view hero" ON public.hero_images
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage hero" ON public.hero_images
    FOR ALL TO authenticated
    USING (public.check_is_admin() OR public.check_is_super_admin());

-- media_items
CREATE POLICY "Public can view media" ON public.media_items
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage media" ON public.media_items
    FOR ALL TO authenticated
    USING (public.check_is_admin() OR public.check_is_super_admin());


-- 5. Storage Fix (Bucket RLS)
-- Standard way to handle storage permissions via CREATE POLICY on storage.objects

DO $$
BEGIN
    -- Ensure the bucket exists (Checking if storage.buckets table is accessible)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        
        -- 1. DROP EXISTING TO PREVENT CONFLICTS
        DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
        DROP POLICY IF EXISTS "Admins Full Access" ON storage.objects;

        -- 2. PUBLIC READ ACCESS
        -- Standard policy for public viewing of images in the 'website_image' bucket
        CREATE POLICY "Public Read Access" ON storage.objects
            FOR SELECT
            USING (bucket_id = 'website_image');

        -- 3. ADMIN FULL ACCESS (Upload, Update, Delete)
        -- Uses the existing profile role check functions
        CREATE POLICY "Admins Full Access" ON storage.objects
            FOR ALL 
            TO authenticated
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
