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
    const { data: results, error: rErr } = await supabase.from('exam_results').select('*').limit(1);
    if (rErr) console.error("exam_results error:", rErr.message);
    else console.log("exam_results columns:", results.length > 0 ? Object.keys(results[0]) : "Empty table");

    const { data: attempts, error: aErr } = await supabase.from('exam_attempts').select('*').limit(1);
    if (aErr) console.error("exam_attempts error:", aErr.message);
    else console.log("exam_attempts columns:", attempts.length > 0 ? Object.keys(attempts[0]) : "Empty table");
}
run();
