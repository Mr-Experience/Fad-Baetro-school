import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
    const { data: students, error: studentsError } = await supabase.from('students').select('*').limit(1);
    console.log("Students schema inferred from row:", students && students.length > 0 ? Object.keys(students[0]) : "Empty or error", studentsError);

    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').limit(1);
    console.log("Profiles schema inferred from row:", profiles && profiles.length > 0 ? Object.keys(profiles[0]) : "Empty or error", profilesError);
}
checkSchema();
