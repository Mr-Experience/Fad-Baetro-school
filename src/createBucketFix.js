
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createProfileImageBucket() {
    console.log("Attempting to create 'profile image' bucket...");
    try {
        const { data, error } = await supabase.storage.createBucket('profile image', {
            public: true,
            fileSizeLimit: 2048576,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
        });

        if (error) {
            console.error("Bucket creation error:", error.message);
            // If it's permission, we need to know.
        } else {
            console.log("SUCCESS! Bucket created:", data);
        }
    } catch (e) {
        console.error("Caught exception:", e);
    }
}

createProfileImageBucket();
