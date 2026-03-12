-- UPDATED RESET SCRIPT (Fixes Not-Null Error)
-- Run this in the Supabase SQL Editor

-- 1. Reset System Settings (Using empty strings to avoid NOT-NULL errors)
UPDATE public.system_settings 
SET current_session = '', 
    current_term = '' 
WHERE id = 1;

-- 2. Wipe Academic Data (Questions, Subjects, Exams)
DELETE FROM public.questions;
DELETE FROM public.active_exams;
DELETE FROM public.exam_configs;
DELETE FROM public.exam_results;
DELETE FROM public.exam_attempts;
DELETE FROM public.subjects;

-- 3. Wipe Non-Administrative Profiles
DELETE FROM public.profiles 
WHERE role NOT IN ('admin', 'super_admin');

-- 4. Sync Auth Users with the remaining Admin/Super Admin profiles
DELETE FROM auth.users 
WHERE id NOT IN (
    SELECT id FROM public.profiles 
    WHERE role IN ('admin', 'super_admin')
);
