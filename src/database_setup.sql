-- ==========================================
-- FAD MAESTRO: ULTIMATE MASTER DATABASE SETUP
-- (Includes 4-Role System, Detailed Classes, & Recursion Fix)
-- ==========================================

-- 1. CLEANUP (Standard)
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP FUNCTION IF EXISTS public.check_is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.check_is_admin() CASCADE;

-- 2. CREATE CLASSES TABLE
CREATE TABLE public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with full breakdown (JSS 1-3 to SSS 3 Art/Com/Sci)
INSERT INTO public.classes (class_name) VALUES 
('JSS 1'), ('JSS 2'), ('JSS 3'),
('SSS 1 ART'), ('SSS 1 COM'), ('SSS 1 SCI'),
('SSS 2 ART'), ('SSS 2 COM'), ('SSS 2 SCI'),
('SSS 3 ART'), ('SSS 3 COM'), ('SSS 3 SCI');

-- 3. HELPER FUNCTIONS (Stops Infinite Recursion/Loops in Security)
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE PROFILES TABLE
-- Roles: student, admin, super_admin, candidate
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL, 
    phone_number TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending', -- Used for Candidates (pending, approved, deactivated)
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Safety check for the 4 valid roles
    CONSTRAINT valid_role CHECK (role IN ('student', 'admin', 'super_admin', 'candidate'))
);

-- 5. CREATE SYSTEM SETTINGS
CREATE TABLE public.system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    current_session TEXT DEFAULT '2024/2025',
    current_term TEXT DEFAULT 'First Term',
    inquiry_bg_url TEXT,
    hero_bg_url TEXT,
    news_bg_url TEXT,
    about_image_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Seed initial settings
INSERT INTO public.system_settings (id, current_session, current_term) 
VALUES (1, '2024/2025', 'First Term');

-- 6. SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- [Profiles Policies]
CREATE POLICY "Users browse profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users edit own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "Super Admin Master Access" ON public.profiles FOR ALL TO authenticated USING (public.check_is_super_admin());
CREATE POLICY "Admin Restricted Access" ON public.profiles FOR ALL TO authenticated 
USING (public.check_is_admin()) WITH CHECK (role IN ('student', 'candidate'));

-- [Classes Policies]
CREATE POLICY "Allow select classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin manage classes" ON public.classes FOR ALL TO authenticated USING (public.check_is_super_admin());

-- [Settings Policies]
CREATE POLICY "Public view settings" ON public.system_settings FOR SELECT TO public USING (true);
CREATE POLICY "Super admin manage settings" ON public.system_settings FOR ALL TO authenticated USING (public.check_is_super_admin());

-- 7. ADMIN DELETION RPC
-- This allows admins to fully remove a user from both auth and profiles (via cascade)
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS void AS $$
DECLARE
  calling_user_role TEXT;
BEGIN
  -- 1. Get the role of the person calling the function
  SELECT role INTO calling_user_role FROM public.profiles WHERE id = auth.uid();
  
  -- 2. Only allow Admin or Super Admin to delete
  IF calling_user_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can delete users.';
  END IF;

  -- 3. Prevent Admin from deleting Super Admin
  IF calling_user_role = 'admin' THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id AND role = 'super_admin') THEN
       RAISE EXCEPTION 'Unauthorized: Standard admins cannot delete super admins.';
    END IF;
  END IF;

  -- 4. Perform deletion from auth.users (cascades to public.profiles)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
