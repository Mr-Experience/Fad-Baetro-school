const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data: subjects, error: sErr } = await supabase.from('subjects').select('*').limit(1);
    if (sErr) console.error("subjects error:", sErr.message);
    else console.log("subjects columns:", subjects.length > 0 ? Object.keys(subjects[0]) : "Empty table");
}
run();
