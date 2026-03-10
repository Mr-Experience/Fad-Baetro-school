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
    console.log("Investigating 'Agricultural Science' configs...");

    // Search for Agricultural Science subject
    const { data: subjects } = await supabase.from('subjects').select('id, subject_name').ilike('subject_name', '%Agric%');
    console.log("Subjects found:", subjects);

    if (subjects && subjects.length > 0) {
        const subjectIds = subjects.map(s => s.id);
        const { data: configs, error } = await supabase
            .from('exam_configs')
            .select('*, subjects(subject_name)')
            .in('subject_id', subjectIds);

        if (error) {
            console.error("Error:", error.message);
        } else {
            console.log("\nConfig Details:");
            configs.forEach(c => {
                console.log(`- ID: ${c.id}`);
                console.log(`  Subject: ${c.subjects?.subject_name}`);
                console.log(`  Active: ${c.is_active}`);
                console.log(`  Visible At: ${c.visible_at}`);
                console.log(`  Session: ${c.session_id}`);
                console.log(`  Term: ${c.term_id}`);
                console.log(`  Duration: ${c.duration_minutes} mins`);
                console.log('-------------------');
            });
        }
    } else {
        console.log("No Agric subjects found.");
    }
}
run();
