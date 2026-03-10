
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probeTables() {
    console.log("Probing TABLE permissions...");

    // We can't really "sign up" easily from a node script without real email often 
    // but we can try to insert a record into 'students' if RLS is loose.
    const { data, error } = await supabase.from('students').insert({
        full_name: 'PROBE_USER',
        email: `probe_${Date.now()}@test.com`,
        class_id: '64dc5df2-99cc-4c92-b132-40c898639dfe' // Use real class ID if known
    }).select();

    if (error) {
        console.log(`Table "students" Insert: Failed (${error.message})`);
    } else {
        console.log("Table \"students\" Insert: SUCCESS!");
        // Cleanup
        await supabase.from('students').delete().eq('id', data[0].id);
    }
}

probeTables();
