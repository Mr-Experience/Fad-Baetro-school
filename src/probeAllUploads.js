
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probeUploads() {
    const buckets = ['Profile Image', 'portal-assets', 'media', 'avatars', 'news-images', 'gallery', 'uploads'];
    console.log("Probing ALL buckets for UPLOAD permission...");

    for (const b of buckets) {
        process.stdout.write(`Testing [${b}] root upload... `);
        const { error: err1 } = await supabase.storage.from(b).upload(`probe_${Date.now()}.txt`, 'test');
        if (!err1) {
            console.log("SUCCESS!");
            continue;
        } else {
            console.log(`Failed (${err1.message})`);
        }

        process.stdout.write(`Testing [${b}] avatars/ upload... `);
        const { error: err2 } = await supabase.storage.from(b).upload(`avatars/probe_${Date.now()}.txt`, 'test');
        if (!err2) {
            console.log("SUCCESS!");
        } else {
            console.log(`Failed (${err2.message})`);
        }
    }
}

probeUploads();
