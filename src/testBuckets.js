
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
    console.log('Checking Supabase buckets...');
    try {
        const { data, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error('Error listing buckets:', error.message);
            return;
        }

        console.log('Available buckets:');
        if (data.length === 0) {
            console.log('No buckets found.');
        } else {
            data.forEach(bucket => {
                console.log(`- ID: ${bucket.id}, Name: ${bucket.name}, Public: ${bucket.public}`);
            });
        }
    } catch (err) {
        console.error('Unexpected error:', err.message);
    }
}

checkBuckets();
