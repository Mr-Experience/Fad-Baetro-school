
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testListAndUpload() {
    const bucket = 'portal-assets';
    console.log(`Testing bucket "${bucket}"...`);

    console.log('1. Listing...');
    const { data: listData, error: listError } = await supabase.storage.from(bucket).list();
    if (listError) {
        console.log('List error:', listError.message);
    } else {
        console.log('List success, files found:', listData.length);
    }

    console.log('2. Uploading...');
    const { data: upData, error: upError } = await supabase.storage.from(bucket).upload('test.txt', 'test');
    if (upError) {
        console.log('Upload error message:', upError.message);
        console.log('Upload error status:', upError.status);
    } else {
        console.log('Upload success:', upData);
    }
}

testListAndUpload();
