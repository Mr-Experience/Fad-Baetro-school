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
    const { data: posts, error: pErr } = await supabase.from('posts').select('*').limit(1);
    if (!pErr && posts && posts.length > 0) console.log("Posts columns:", Object.keys(posts[0]));

    const { data: profiles, error: prErr } = await supabase.from('profiles').select('*').limit(1);
    if (!prErr && profiles && profiles.length > 0) console.log("Profiles columns:", Object.keys(profiles[0]));

    const { data: students, error: sErr } = await supabase.from('students').select('*').limit(1);
    if (!sErr && students && students.length > 0) console.log("Students columns:", Object.keys(students[0]));
    else if (sErr) console.error("Students error:", sErr.message);
}
run();
