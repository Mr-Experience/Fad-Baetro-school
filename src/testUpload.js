
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    console.log('Testing upload to "profile image"...');
    const content = Buffer.from('test content');
    const { data, error } = await supabase.storage
        .from('profile image')
        .upload('test.txt', content, { contentType: 'text/plain', upsert: true });

    if (error) {
        console.error('Upload error:', error);
    } else {
        console.log('Upload success:', data);
    }
}

testUpload();
