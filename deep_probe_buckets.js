const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const list = [
        'profile image', 'profile-image', 'profile_image',
        'profile images', 'profile-images', 'profile_images',
        'avatars', 'profiles', 'student-images', 'student_images'
    ];
    for (const b of list) {
        const { error } = await supabase.storage.from(b).upload('probe.txt', 'test');
        if (error && error.message.includes('not found')) {
            // continue
        } else if (error) {
            console.log(`- '${b}': FOUND (but error: ${error.message})`);
        } else {
            console.log(`- '${b}': FOUND AND UPLOAD WORKED!`);
            await supabase.storage.from(b).remove(['probe.txt']);
        }
    }
}
check();
