-- CLEANUP SCRIPT: Run this in Supabase SQL Editor
-- This will delete all profiles EXCEPT the specified ones and clean up related data.

-- 1. Remove related data for users being deleted (prevents foreign key errors)
DELETE FROM public.exam_results 
WHERE student_id NOT IN (
    SELECT id FROM public.profiles 
    WHERE email IN ('superadmin@school.com', 'admin@school.com', 'student@gmail.com')
);

DELETE FROM public.exam_attempts 
WHERE student_id NOT IN (
    SELECT id FROM public.profiles 
    WHERE email IN ('superadmin@school.com', 'admin@school.com', 'student@gmail.com')
);

-- 2. Delete the actual profiles
DELETE FROM public.profiles 
WHERE email NOT IN ('superadmin@school.com', 'admin@school.com', 'student@gmail.com')
OR email IS NULL;

-- 3. Clean up the Authentication accounts
-- NOTE: In some Supabase setups, deleting from auth.users requires superuser permissions.
-- If this fails, you can manually delete from the "Authentication > Users" menu in the dashboard.
DELETE FROM auth.users 
WHERE email NOT IN ('superadmin@school.com', 'admin@school.com', 'student@gmail.com')
OR email IS NULL;
