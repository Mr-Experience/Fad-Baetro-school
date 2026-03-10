
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistence() {
    const bucket = 'Profile Image';
    console.log(`Checking existence of bucket: "${bucket}"`);
    const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });

    if (error) {
        console.log(`Error: ${error.message} (Status: ${error.status})`);
    } else {
        console.log(`SUCCESS! Bucket exists. Found ${data.length} items (or empty).`);
    }
}

checkExistence();
