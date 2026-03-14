-- subjects_master_setup.sql: Complete Subjects Schema and Seeding
-- Provides a full curriculum for all classes (JSS 1 - SSS 3)

-- 1. CLEANUP
DROP TABLE IF EXISTS public.subjects CASCADE;

-- 2. CREATE TABLE
CREATE TABLE public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_name TEXT NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure same subject isn't added twice to the same class
    UNIQUE(subject_name, class_id)
);

-- 3. ENABLE RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
CREATE POLICY "Public select subjects" ON public.subjects FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL TO authenticated 
USING (public.check_is_admin() OR public.check_is_super_admin());

-- 5. SEED DATA (Curriculum for all classes)
-- This logic finds the class IDs and inserts standard subjects for each category
DO $$
DECLARE
    cls RECORD;
BEGIN
    FOR cls IN SELECT id, class_name FROM public.classes LOOP
        
        -- Default Core Subjects for EVERY class
        INSERT INTO public.subjects (subject_name, class_id) VALUES 
        ('Mathematics', cls.id),
        ('English Language', cls.id),
        ('Civic Education', cls.id);

        -- JSS Specific (Junior Secondary)
        IF cls.class_name LIKE 'JSS%' THEN
            INSERT INTO public.subjects (subject_name, class_id) VALUES 
            ('Basic Science', cls.id),
            ('Basic Technology', cls.id),
            ('Social Studies', cls.id),
            ('Business Studies', cls.id),
            ('Agricultural Science', cls.id),
            ('Home Economics', cls.id),
            ('Christian Religious Studies', cls.id),
            ('Computer Studies', cls.id);
        
        -- SSS ART Specific
        ELSIF cls.class_name LIKE 'SSS % ART' THEN
            INSERT INTO public.subjects (subject_name, class_id) VALUES 
            ('Literature in English', cls.id),
            ('Government', cls.id),
            ('History', cls.id),
            ('Christian Religious Studies', cls.id),
            ('Yoruba', cls.id),
            ('Economics', cls.id);

        -- SSS COM Specific (Commercial)
        ELSIF cls.class_name LIKE 'SSS % COM' THEN
            INSERT INTO public.subjects (subject_name, class_id) VALUES 
            ('Financial Accounting', cls.id),
            ('Commerce', cls.id),
            ('Economics', cls.id),
            ('Government', cls.id),
            ('Office Practice', cls.id);

        -- SSS SCI Specific (Science)
        ELSIF cls.class_name LIKE 'SSS % SCI' THEN
            INSERT INTO public.subjects (subject_name, class_id) VALUES 
            ('Biology', cls.id),
            ('Chemistry', cls.id),
            ('Physics', cls.id),
            ('Further Mathematics', cls.id),
            ('Agricultural Science', cls.id),
            ('Geography', cls.id);
            
        END IF;
    END LOOP;
END $$;
