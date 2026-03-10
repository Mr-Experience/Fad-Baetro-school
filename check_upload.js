const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const list = ['profile image', 'avatars', 'portal-assets'];
    for (const b of list) {
        console.log(`Checking bucket: ${b}`);
        const { data, error } = await supabase.storage.from(b).upload(`probe_${Date.now()}.txt`, 'test');
        if (error) {
            console.log(`- '${b}' UPLOAD FAILED: ${error.message} (status: ${error.status})`);
        } else {
            console.log(`- '${b}' UPLOAD SUCCESS!`);
        }
    }
}
check();
