-- examine_master_setup.sql: Full Academic Examination Engine
-- Questions, Configuration, Attempts, and Results

-- 1. CLEANUP
DROP TABLE IF EXISTS public.student_answers CASCADE;
DROP TABLE IF EXISTS public.exam_results CASCADE;
DROP TABLE IF EXISTS public.active_exams CASCADE;
DROP TABLE IF EXISTS public.exam_configs CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;

-- 2. CREATE QUESTIONS TABLE
CREATE TABLE public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL, -- e.g. '2024/2025'
    term_id TEXT NOT NULL,    -- e.g. 'First Term'
    question_type TEXT NOT NULL CHECK (question_type IN ('test', 'exam', 'candidate')),
    
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    options JSONB, -- Stores { a: "...", b: "...", ... } for flexible access
    
    correct_answer TEXT NOT NULL, -- e.g. 'A', 'B', 'C', 'D'
    correct_option TEXT,           -- Duplicate/Alias for app compatibility
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE EXAM CONFIGS (Settings for specific tests)
CREATE TABLE public.exam_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL,
    session_id TEXT NOT NULL,
    term_id TEXT NOT NULL,
    
    is_active BOOLEAN DEFAULT false,
    visible_at TIMESTAMPTZ DEFAULT NOW(),
    duration_minutes INT DEFAULT 60,
    question_count INT DEFAULT 0, -- 0 means show all
    selection_type TEXT DEFAULT 'random', -- 'random' or 'ordered'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one config per subject/type/term
    UNIQUE(class_id, subject_id, question_type, session_id, term_id)
);

-- 4. CREATE ACTIVE EXAMS (Instant access for students)
CREATE TABLE public.active_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_config_id UUID REFERENCES public.exam_configs(id) ON DELETE CASCADE UNIQUE,
    session_id TEXT NOT NULL,
    term_id TEXT NOT NULL,
    visible_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE EXAM ATTEMPTS (Track start/end times and status)
CREATE TABLE public.exam_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.exam_configs(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    term_id TEXT NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'started', -- 'started', 'completed', 'timed_out'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one attempt per student per exam per term
    UNIQUE(student_id, exam_id, session_id, term_id)
);

-- 6. CREATE STUDENT ANSWERS (Track individual choices during exam)
CREATE TABLE public.student_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option TEXT, -- e.g. 'A', 'B', 'C', 'D'
    is_correct BOOLEAN,
    session_id TEXT NOT NULL,
    term_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one answer per user per question per term
    UNIQUE(student_id, question_id, session_id, term_id)
);

-- 6. CREATE EXAM RESULTS (To track final scores)
CREATE TABLE public.exam_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.exam_configs(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL,
    total_questions INT NOT NULL,
    correct_answers INT NOT NULL,
    score_percent DECIMAL(5,2),
    answers_json JSONB,
    session_id TEXT NOT NULL,
    term_id TEXT NOT NULL,
    class_name TEXT,
    subject_name TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one result per student per subject/type per term
    UNIQUE(student_id, subject_id, question_type, session_id, term_id)
);

-- 7. SECURITY (RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- [Policies]
-- Questions: Admins manage all; Authenticated users view during exams
CREATE POLICY "Admins manage questions" ON public.questions FOR ALL TO authenticated 
USING (public.check_is_admin() OR public.check_is_super_admin());

CREATE POLICY "Authenticated users view questions" ON public.questions FOR SELECT TO authenticated
USING (true);

-- Student Answers
CREATE POLICY "Users manage own answers" ON public.student_answers FOR ALL TO authenticated 
USING (auth.uid() = student_id);

CREATE POLICY "Admins view all answers" ON public.student_answers FOR SELECT TO authenticated 
USING (public.check_is_admin() OR public.check_is_super_admin());

-- Configs & Active
CREATE POLICY "Public select active" ON public.active_exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage active" ON public.active_exams FOR ALL TO authenticated 
USING (public.check_is_admin() OR public.check_is_super_admin());

CREATE POLICY "Public select configs" ON public.exam_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage configs" ON public.exam_configs FOR ALL TO authenticated 
USING (public.check_is_admin() OR public.check_is_super_admin());

-- Exam Attempts
CREATE POLICY "Users manage own attempts" ON public.exam_attempts FOR ALL TO authenticated 
USING (auth.uid() = student_id);

CREATE POLICY "Admins view all attempts" ON public.exam_attempts FOR SELECT TO authenticated 
USING (public.check_is_admin() OR public.check_is_super_admin());
CREATE POLICY "Users view own results" ON public.exam_results FOR SELECT TO authenticated 
USING (auth.uid() = student_id);

CREATE POLICY "Admins view all results" ON public.exam_results FOR SELECT TO authenticated 
USING (public.check_is_admin() OR public.check_is_super_admin());

CREATE POLICY "System insert results" ON public.exam_results FOR INSERT TO authenticated 
WITH CHECK (true);

-- 8. REFRESH TRIGGER
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_questions_modtime BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_configs_modtime BEFORE UPDATE ON public.exam_configs FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
