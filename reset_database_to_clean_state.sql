-- FINAL CLEANUP & RESET SCRIPT
-- Run this in the Supabase SQL Editor

-- 1. Reset System Settings (No active session/term)
UPDATE public.system_settings 
SET current_session = NULL, 
    current_term = NULL 
WHERE id = 1;

-- 2. Wipe Academic Data (Questions, Subjects, Exams)
-- We use DELETE instead of TRUNCATE to avoid permission issues in some environments
DELETE FROM public.questions;
DELETE FROM public.active_exams;
DELETE FROM public.exam_configs;
DELETE FROM public.exam_results;
DELETE FROM public.exam_attempts;
DELETE FROM public.subjects;

-- 3. Wipe Non-Administrative Profiles
-- This removes all students and candidates
DELETE FROM public.profiles 
WHERE role NOT IN ('admin', 'super_admin');

-- 4. Sync Auth Users with the remaining Admin/Super Admin profiles
-- This ensures the login info is preserved only for admins
DELETE FROM auth.users 
WHERE id NOT IN (
    SELECT id FROM public.profiles 
    WHERE role IN ('admin', 'super_admin')
);

-- Optional: If you want to clear classes as well, uncomment the line below.
-- Usually, classes (JSS 1, etc.) are kept as structure.
-- DELETE FROM public.classes;
