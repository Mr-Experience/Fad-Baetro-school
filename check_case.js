const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const list = ['profile image', 'Profile Image', 'profile_image', 'Profile_Image'];
    for (const b of list) {
        const { data, error } = await supabase.storage.from(b).list();
        if (error) {
            console.log(`- '${b}': FAILED: ${error.message}`);
        } else {
            console.log(`- '${b}': FOUND!`);
        }
    }
}
check();
