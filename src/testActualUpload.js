
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    const bucket = 'Profile Image';
    const filePath = `avatars/test_${Date.now()}.txt`;
    console.log(`Testing upload to "${bucket}" at path "${filePath}"...`);

    const { data, error } = await supabase.storage.from(bucket).upload(filePath, 'test bucket existence');

    if (error) {
        console.error("Upload error:", error.message);
    } else {
        console.log("SUCCESS! Upload worked.");
        // Try to get public URL to verify it's public
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
        console.log("Public URL:", publicUrl);

        // Cleanup if possible
        await supabase.storage.from(bucket).remove([filePath]);
    }
}

testUpload();
