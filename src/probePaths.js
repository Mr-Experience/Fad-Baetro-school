
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probePaths() {
    const buckets = ['Profile Image', 'portal-assets'];
    const paths = ['', 'avatars/', 'hero/', 'media/', 'profiles/'];

    for (const b of buckets) {
        for (const p of paths) {
            const fileName = `probe_${Date.now()}.txt`;
            const fullPath = `${p}${fileName}`;
            process.stdout.write(`Testing [${b}] path [${fullPath}]... `);
            const { error } = await supabase.storage.from(b).upload(fullPath, 'test');
            if (error) {
                console.log(`Failed (${error.message})`);
            } else {
                console.log("SUCCESS!");
                await supabase.storage.from(b).remove([fullPath]);
            }
        }
    }
}

probePaths();
