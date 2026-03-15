
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Searching for exam results in JSS 2 (or similar)...");
    const { data: results } = await supabase
        .from('exam_results')
        .select(`
            student_id,
            profiles(full_name, role)
        `)
        .limit(10);
    
    console.log("Sample results with profile roles:");
    results?.forEach(r => {
        console.log(`${r.profiles?.full_name}: ${r.profiles?.role}`);
    });
}

check();
