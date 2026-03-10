const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getStorageUsage() {
    try {
        const potentialBuckets = ['profile image', 'portal-assets', 'media', 'avatars', 'news-images', 'gallery', 'uploads'];
        let totalSizeBytes = 0;
        let bucketsFound = 0;

        console.log("Checking Supabase Storage usage...");

        for (const bucketName of potentialBuckets) {
            // console.log(`Attempting to list files in bucket: '${bucketName}'...`);

            const { data: files, error } = await supabase.storage.from(bucketName).list('', {
                limit: 1000,
                offset: 0
            });

            if (error) {
                // Ignore error if bucket doesn't exist
                if (error.message.includes('not found') || error.message.includes('does not exist') || error.status === 404) {
                    continue;
                }
                console.warn(`  ! Note for '${bucketName}': ${error.message}`);
                continue;
            }

            if (files) {
                bucketsFound++;
                let bucketSize = 0;
                for (const file of files) {
                    if (file.metadata && file.metadata.size) {
                        bucketSize += file.metadata.size;
                    }
                }
                console.log(`[FOUND] Bucket: '${bucketName}'`);
                console.log(`  - Files: ${files.length}`);
                console.log(`  - Size: ${(bucketSize / (1024 * 1024)).toFixed(3)} MB`);
                totalSizeBytes += bucketSize;
            }
        }

        const totalMB = (totalSizeBytes / (1024 * 1024)).toFixed(3);
        const freeTierLimitMB = 1000; // 1GB limit for free tier
        const percent = ((totalSizeBytes / (freeTierLimitMB * 1024 * 1024)) * 100).toFixed(4);

        if (bucketsFound === 0) {
            console.log("\nNo accessible buckets found with the current credentials.");
            console.log("This might be because no buckets have been created yet or RLS policies prevent access.");
        } else {
            console.log(`\n================================`);
            console.log(`TOTAL USAGE SUMMARY`);
            console.log(`================================`);
            console.log(`Total Buckets Checked: ${bucketsFound}`);
            console.log(`Total Storage Used:    ${totalMB} MB`);
            console.log(`Project Tier:          Free Tier (Estimated)`);
            console.log(`Tier Limit:            1.00 GB (1000 MB)`);
            console.log(`Current Percentage:    ${percent}%`);
            console.log(`================================`);
        }

    } catch (err) {
        console.error("Error calculating storage:", err.message);
    }
}

getStorageUsage();
