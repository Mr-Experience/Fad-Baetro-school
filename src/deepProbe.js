
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probeDeep() {
    const list = [
        'profile image', 'profiles', 'profile_image', 'profile-image',
        'profile', 'profile images', 'profile_images', 'profile-images',
        'avatars', 'images', 'photos', 'students', 'student-profiles',
        'Profile Image', 'PROFILE IMAGE', 'Profile_Image', 'Profile_image',
        'ProfileImage', 'profileImage'
    ];

    console.log("Deep probing storage buckets...");
    for (const b of list) {
        // We use .list() as a lightweight way to check existence if possible.
        // Even if listing files is blocked, list() for a non-existent bucket 
        // will sometimes return an error we can catch.
        // But better is a trial upload of a tiny file.
        process.stdout.write(`Testing [${b}]... `);
        const { error } = await supabase.storage.from(b).upload('probe_test.txt', 'probe', { upsert: true });

        if (error) {
            if (error.message.includes('Bucket not found')) {
                console.log("Not Found");
            } else if (error.message.includes('RLS') || error.message.includes('policy') || error.message.includes('permission')) {
                console.log("EXISTS (RLS Error)");
                // If we get an RLS error, the bucket EXISTS but we lack permission!
            } else {
                console.log(`Error: ${error.message}`);
            }
        } else {
            console.log("SUCCESS!");
            await supabase.storage.from(b).remove(['probe_test.txt']);
        }
    }
}

probeDeep();
