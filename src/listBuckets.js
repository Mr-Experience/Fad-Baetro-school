
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllBuckets() {
    console.log("Fetching all buckets...");
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error("Error listing buckets:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log("Available buckets:");
        data.forEach(b => {
            console.log(`- ID: "${b.id}", Name: "${b.name}", Public: ${b.public}`);
        });
    } else {
        console.log("No buckets found.");
    }
}

listAllBuckets();
