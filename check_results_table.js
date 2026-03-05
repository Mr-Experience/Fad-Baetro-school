const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Checking 'exam_results' table...");
    const { data, error } = await supabase.from('exam_results').select('*').limit(1);

    if (error) {
        console.log(`❌ Table 'exam_results' check failed: ${error.message}`);
        if (error.code === '42P01') {
            console.log("HELP: The table does not exist.");
        }
    } else {
        console.log("✅ Table 'exam_results' EXISTS!");
        if (data.length > 0) {
            console.log("Found sample row:", Object.keys(data[0]));
        } else {
            console.log("Table exists but is empty.");
        }
    }
}

run();
