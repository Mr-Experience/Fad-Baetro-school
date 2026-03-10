const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(url, key);

async function check() {
    console.log("Checking classes table...");
    const { data: cData, error: cErr } = await supabase.from('classes').select('*').limit(1);
    if (cErr) console.log("- classes error:", cErr.message);
    else console.log("- classes FOUND. Row:", cData[0]);

    console.log("\nChecking candidates table columns (attempting insert error)...");
    const { error: iErr } = await supabase.from('candidates').insert({ id: '00000000-0000-0000-0000-000000000000' });
    if (iErr) console.log("- candidates insert error (for debugging columns):", iErr.message);
}
check();
