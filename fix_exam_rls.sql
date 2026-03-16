-- fix_exam_rls.sql: COMPREHENSIVE FIX FOR EXAM SYSTEM PERMISSIONS
-- This ensures Admins and Super Admins can manage all exam-related tables (Configs, Questions, Results)
-- Run this in the Supabase SQL Editor to resolve "violates row-level security policy" errors.

-- 1. QUESTIONS TABLE
DROP POLICY IF EXISTS "Admins manage questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users view questions" ON public.questions;

-- Select: Everyone authenticated can see questions (needed for students during exams)
CREATE POLICY "Questions - authenticated select" ON public.questions
    FOR SELECT TO authenticated USING (true);

-- Manage: Admins/Super Admins full control
CREATE POLICY "Questions - admin manage" ON public.questions
    FOR ALL TO authenticated
    USING (public.check_is_admin() OR public.check_is_super_admin())
    WITH CHECK (public.check_is_admin() OR public.check_is_super_admin());


-- 2. EXAM_CONFIGS TABLE
DROP POLICY IF EXISTS "Admins manage configs" ON public.exam_configs;
DROP POLICY IF EXISTS "Public select configs" ON public.exam_configs;

-- Select: Anyone authenticated can see configs
CREATE POLICY "Configs - authenticated select" ON public.exam_configs
    FOR SELECT TO authenticated USING (true);

-- Manage: Admins/Super Admins full control
CREATE POLICY "Configs - admin manage" ON public.exam_configs
    FOR ALL TO authenticated
    USING (public.check_is_admin() OR public.check_is_super_admin())
    WITH CHECK (public.check_is_admin() OR public.check_is_super_admin());


-- 3. ACTIVE_EXAMS TABLE
DROP POLICY IF EXISTS "Admins manage active" ON public.active_exams;
DROP POLICY IF EXISTS "Public select active" ON public.active_exams;

-- Select: Anyone authenticated
CREATE POLICY "Active - authenticated select" ON public.active_exams
    FOR SELECT TO authenticated USING (true);

-- Manage: Admins/Super Admins full control
CREATE POLICY "Active - admin manage" ON public.active_exams
    FOR ALL TO authenticated
    USING (public.check_is_admin() OR public.check_is_super_admin())
    WITH CHECK (public.check_is_admin() OR public.check_is_super_admin());


-- 4. EXAM_ATTEMPTS TABLE
DROP POLICY IF EXISTS "Users manage own attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Admins view all attempts" ON public.exam_attempts;

-- Users can manage their own attempts
CREATE POLICY "Attempts - user manage own" ON public.exam_attempts
    FOR ALL TO authenticated
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- Admins can see everything
CREATE POLICY "Attempts - admin select" ON public.exam_attempts
    FOR SELECT TO authenticated
    USING (public.check_is_admin() OR public.check_is_super_admin());


-- 5. STUDENT_ANSWERS TABLE
DROP POLICY IF EXISTS "Users manage own answers" ON public.student_answers;
DROP POLICY IF EXISTS "Admins view all answers" ON public.student_answers;

-- Users can manage their own answers
CREATE POLICY "Answers - user manage own" ON public.student_answers
    FOR ALL TO authenticated
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- Admins can see everything
CREATE POLICY "Answers - admin select" ON public.student_answers
    FOR SELECT TO authenticated
    USING (public.check_is_admin() OR public.check_is_super_admin());


-- 6. EXAM_RESULTS TABLE
DROP POLICY IF EXISTS "Users view own results" ON public.exam_results;
DROP POLICY IF EXISTS "Admins view all results" ON public.exam_results;
DROP POLICY IF EXISTS "System insert results" ON public.exam_results;

-- Users can see their own results
CREATE POLICY "Results - user select own" ON public.exam_results
    FOR SELECT TO authenticated
    USING (auth.uid() = student_id);

-- Admins can see everything
CREATE POLICY "Results - admin select" ON public.exam_results
    FOR SELECT TO authenticated
    USING (public.check_is_admin() OR public.check_is_super_admin());

-- Crucial: Students must be able to insert their results upon completion
CREATE POLICY "Results - system insert" ON public.exam_results
    FOR INSERT TO authenticated
    WITH CHECK (true);
