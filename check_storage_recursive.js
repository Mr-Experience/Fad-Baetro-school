const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function sumStorage(bucketName, path = '') {
    let size = 0;
    const { data: items, error } = await supabase.storage.from(bucketName).list(path, {
        limit: 1000
    });

    if (error) return 0;
    if (!items) return 0;

    for (const item of items) {
        if (item.metadata) {
            // It's a file
            size += item.metadata.size || 0;
        } else {
            // It's a folder (no metadata/size in list output usually means folder)
            const subPath = path ? `${path}/${item.name}` : item.name;
            size += await sumStorage(bucketName, subPath);
        }
    }
    return size;
}

async function run() {
    console.log("Calculating deep storage usage...");
    const buckets = ['profile image', 'portal-assets', 'media', 'avatars', 'news-images', 'gallery', 'uploads'];
    let totalSize = 0;

    for (const b of buckets) {
        const bSize = await sumStorage(b);
        if (bSize > 0) {
            console.log(`Bucket '${b}': ${(bSize / (1024 * 1024)).toFixed(3)} MB`);
            totalSize += bSize;
        }
    }

    const totalMB = (totalSize / (1024 * 1024)).toFixed(3);
    const limitMB = 1024;
    const percent = ((totalSize / (limitMB * 1024 * 1024)) * 100).toFixed(6);

    console.log(`\nTOTAL USAGE: ${totalMB} MB`);
    console.log(`PERCENTAGE:  ${percent}%`);
}

run();
