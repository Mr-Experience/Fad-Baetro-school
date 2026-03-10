-- SQL script to consolidate students and profiles into a single profiles table

-- 1. Drop existing tables if they exist
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Create the unified profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'admin', 'super_admin', 'candidate')),
    phone_number TEXT,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for the profiles table
-- Allow anyone to view public profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING ( true );

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = id );

-- 5. (IMPORTANT) Recreate your super_admin and admin accounts!
-- Since the old profiles table was dropped, existing admins won't be able to login as an admin until their profile is recreated.
-- You can manually run INSERTs for your admin users if you know their User IDs, e.g.:
-- INSERT INTO profiles (id, full_name, email, role) VALUES ('<uuid-of-super-admin>', 'Super Admin', 'super@admin.com', 'super_admin');
