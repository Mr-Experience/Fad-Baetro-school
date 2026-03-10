const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(url, key);

async function check() {
    console.log("Checking columns for exam_configs...");
    const { data: cols, error } = await supabase.from('exam_configs').select('*').limit(1);
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Columns:", Object.keys(cols[0] || {}));
    }
}
check();
