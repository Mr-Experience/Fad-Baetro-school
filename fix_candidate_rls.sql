-- SQL Fix for Candidate Signup and RLS Issues

-- 1. Ensure the candidates table has the correct structure
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    class_id UUID REFERENCES classes(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on candidates table
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for candidates table
DROP POLICY IF EXISTS "Candidates can insert their own record" ON candidates;
CREATE POLICY "Candidates can insert their own record" 
ON candidates FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Candidates can view their own record" ON candidates;
CREATE POLICY "Candidates can view their own record" 
ON candidates FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Candidates can update their own record" ON candidates;
CREATE POLICY "Candidates can update their own record" 
ON candidates FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all candidates" ON candidates;
CREATE POLICY "Admins can view all candidates" 
ON candidates FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
);

DROP POLICY IF EXISTS "Admins can manage all candidates" ON candidates;
CREATE POLICY "Admins can manage all candidates" 
ON candidates FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
);

-- 4. Ensure candidates can also create/update their own profiles
-- (Profiles table setup often misses the INSERT policy for the user themselves)
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- 5. Public read for classes (needed for signup dropdown)
DROP POLICY IF EXISTS "Public can view classes" ON classes;
CREATE POLICY "Public can view classes" 
ON classes FOR SELECT 
TO public
USING (true);
