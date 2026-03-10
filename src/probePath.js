
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    const bucket = 'profile image';
    console.log(`Testing bucket "${bucket}" with path "avatars/test.txt"...`);
    const { data, error } = await supabase.storage.from(bucket).upload('avatars/test.txt', 'test', { upsert: true });
    if (error) {
        console.log(`Error: ${error.message} (Status: ${error.status})`);
    } else {
        console.log(`SUCCESS!`);
    }

    const bucket2 = 'profiles';
    console.log(`Testing bucket "${bucket2}" with path "avatars/test.txt"...`);
    const { data: data2, error: error2 } = await supabase.storage.from(bucket2).upload('avatars/test.txt', 'test', { upsert: true });
    if (error2) {
        console.log(`Error: ${error2.message} (Status: ${error2.status})`);
    } else {
        console.log(`SUCCESS!`);
    }
}

probe();
