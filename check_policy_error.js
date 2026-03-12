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
    try {
        const email = `check_policy_${Date.now()}@test.com`;
        const { data: { user } } = await supabase.auth.signUp({ email, password: 'Password123!' });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'Checker', role: 'admin' });

        const cid = '64dc5df2-99cc-4c92-b132-40c898639dfe';
        const { data } = await supabase.from('exam_results').select('id, student_id').eq('class_id', cid);
        console.log("Exam results found:", data);

        if (data && data.length > 0) {
            const rid = data[0].id;
            console.log(`Attempting to delete result ${rid}...`);
            const { error: dErr } = await supabase.from('exam_results').delete().eq('id', rid);
            if (dErr) {
                console.log(`  ERROR deleting result: ${dErr.message}`);
            } else {
                console.log(`  SUCCESS deleting result.`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
run();
