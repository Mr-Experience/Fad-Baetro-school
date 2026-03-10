
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probeBuckets() {
    const buckets = ['profile image', 'profile_image', 'profile-image', 'profiles', 'profile', 'student_profiles'];
    for (const b of buckets) {
        console.log(`Probing "${b}"...`);
        // Try to list (which we know might work even if upload doesn't)
        const { data: listData, error: listError } = await supabase.storage.from(b).list();
        if (listError) {
            console.log(`  List: Error: ${listError.message}`);
        } else {
            console.log(`  List: Success (${listData.length} files)`);
        }

        // Try to upload dummy
        const { data: upData, error: upError } = await supabase.storage.from(b).upload('probe.txt', 'probe', { upsert: true });
        if (upError) {
            console.log(`  Upload: Error: ${upError.message} (Status: ${upError.status}, StatusCode: ${upError.statusCode})`);
        } else {
            console.log(`  Upload: SUCCESS!`);
            // Clean up
            await supabase.storage.from(b).remove(['probe.txt']);
        }
    }
}

probeBuckets();
