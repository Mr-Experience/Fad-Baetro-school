-- 1. Create hero_images table
CREATE TABLE IF NOT EXISTS hero_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 2. Create media_items table
CREATE TABLE IF NOT EXISTS media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 3. Enable RLS
ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

-- 4. Public Viewing (Read Only)
DROP POLICY IF EXISTS "Public View Hero" ON hero_images;
CREATE POLICY "Public View Hero" ON hero_images FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public View Media" ON media_items;
CREATE POLICY "Public View Media" ON media_items FOR SELECT USING (is_active = true);

-- 5. Admin Management (Full Access)
DROP POLICY IF EXISTS "Admin Manage Hero" ON hero_images;
CREATE POLICY "Admin Manage Hero" ON hero_images FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin'))
);

DROP POLICY IF EXISTS "Admin Manage Media" ON media_items;
CREATE POLICY "Admin Manage Media" ON media_items FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin'))
);
