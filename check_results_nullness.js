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
        const email = `check_results_null_${Date.now()}@example.com`;
        const password = 'Password123!';
        const { data: { user } } = await supabase.auth.signUp({ email, password });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'Checker', role: 'admin' });

        const { data: results, count } = await supabase.from('exam_results').select('id, class_id').is('class_id', 'not', null);
        console.log("Exam results with non-NULL class_id:", results ? results.length : 0);
        if (results && results.length > 0) {
            console.log("Values:", results.map(r => r.class_id));
        }
    } catch (e) {
        console.error(e);
    }
}
run();
