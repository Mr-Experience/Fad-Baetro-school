const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectBucket(bucketName) {
    console.log(`\nInspecting Bucket: '${bucketName}'`);
    const { data: files, error } = await supabase.storage.from(bucketName).list('', {
        limit: 100,
        offset: 0
    });

    if (error) {
        console.error(`  Error: ${error.message}`);
        return;
    }

    if (!files || files.length === 0) {
        console.log("  No files found.");
        return;
    }

    files.forEach(f => {
        const size = f.metadata ? f.metadata.size : 'No size';
        console.log(`  - ${f.name} (${size} bytes) [Type: ${f.metadata ? f.metadata.mimetype : 'unknown'}]`);
    });
}

async function run() {
    await inspectBucket('portal-assets');
    await inspectBucket('profile image');
}

run();
