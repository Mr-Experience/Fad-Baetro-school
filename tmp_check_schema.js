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
    const cols = ['question_type', 'type', 'category', 'exam_type'];
    for (const col of cols) {
        const { error } = await supabase.from('questions').select(col).limit(1);
        console.log(`Column '${col}': ${error ? 'NOT FOUND' : 'EXISTS'}`);
    }
}
run();
