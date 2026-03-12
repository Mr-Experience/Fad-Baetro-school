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
    const { data: subjects } = await supabase.from('subjects').select('id, subject_name, class_id');
    console.log("Subjects list (first 10):", subjects?.slice(0, 10));

    const { data: classes } = await supabase.from('classes').select('id, class_name');
    console.log("Classes list:", classes);
}
run();
