import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://elelmzeszymkszddfwtp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0'
);

async function checkSchema() {
    const { data: students, error: studentsError } = await supabase.from('students').select('*').limit(1);
    console.log("Students schema:", students && students.length > 0 ? Object.keys(students[0]) : "Empty or error", studentsError);

    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').limit(1);
    console.log("Profiles schema:", profiles && profiles.length > 0 ? Object.keys(profiles[0]) : "Empty or error", profilesError);
}
checkSchema();
