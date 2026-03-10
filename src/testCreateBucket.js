
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function tryCreateBucket() {
    console.log('Attempting to create bucket "profile image"...');
    try {
        const { data, error } = await supabase.storage.createBucket('profile image', {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 2097152 // 2MB
        });

        if (error) {
            console.error('Error creating bucket:', error.message);
            return;
        }

        console.log('Bucket created successfully:', data);
    } catch (err) {
        console.error('Unexpected error:', err.message);
    }
}

tryCreateBucket();
