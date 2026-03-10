
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    const variations = ['profile-table', 'profile_table', 'profile table', 'profile-image', 'profile_image', 'profile image'];
    for (const v of variations) {
        console.log(`Testing "${v}"...`);
        const { data, error } = await supabase.storage.from(v).upload('test.txt', 'test', { upsert: true });
        if (error) {
            console.log(`  Error: ${error.message} (Status: ${error.status})`);
        } else {
            console.log(`  SUCCESS!`);
            return;
        }
    }
}

probe();
