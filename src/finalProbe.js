
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    const list = [
        'profile image', 'profiles', 'profile_table', 'profile-table',
        'profile', 'student_profiles', 'profile_images', 'profile-images',
        'student-images', 'student_images', 'avatars'
    ];
    for (const b of list) {
        console.log(`Testing "${b}"...`);
        // Use a folder path just in case root is blocked
        const { error } = await supabase.storage.from(b).upload('avatars/probe.txt', 'probe', { upsert: true });
        if (error) {
            console.log(`  Error: ${error.message} (Status: ${error.status})`);
        } else {
            console.log(`  SUCCESS!`);
            await supabase.storage.from(b).remove(['avatars/probe.txt']);
            return;
        }
    }
}

probe();
