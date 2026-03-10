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
    console.log("Listing ALL active exam configs...");
    const { data: configs, error } = await supabase
        .from('exam_configs')
        .select('*, subjects(subject_name)')
        .eq('is_active', true);

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    console.log(`Found ${configs.length} active configs.`);
    configs.forEach(c => {
        console.log(`- Subject: ${c.subjects?.subject_name} (${c.question_type})`);
        console.log(`  Visible At: ${c.visible_at}`);
        console.log(`  Duration: ${c.duration_minutes} mins`);
        console.log(`  Session/Term: ${c.session_id} / ${c.term_id}`);
        console.log(`  Class ID: ${c.class_id}`);
        console.log('-------------------');
    });
}
run();
