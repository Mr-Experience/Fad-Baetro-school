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
        const email = `final_check_${Date.now()}@example.com`;
        const password = 'Password123!';
        const { data: { user } } = await supabase.auth.signUp({ email, password });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'Final Checker', role: 'admin' });

        const { data: results } = await supabase.from('exam_results').select('id, class_id, class_name');
        console.log("Current exam results state:", results);

        const { data: classes } = await supabase.from('classes').select('id, class_name');
        console.log("Current classes state:", classes);
    } catch (e) {
        console.error(e);
    }
}
run();
