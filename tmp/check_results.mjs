import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkResults() {
    const { data, error } = await supabase
        .from('exam_results')
        .select('*');
    
    if (error) {
        console.error(error);
    } else {
        console.log(`Found ${data.length} records in exam_results table.`);
        console.log(JSON.stringify(data, null, 2));
    }
}

checkResults();
