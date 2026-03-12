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
        const email = `check_results_${Date.now()}@example.com`;
        const password = 'Password123!';
        await supabase.auth.signUp({ email, password });
        await supabase.from('profiles').insert({ id: (await supabase.auth.getUser()).data.user.id, email, full_name: 'Checker', role: 'admin' });

        const { data, error, count } = await supabase.from('exam_results').select('*', { count: 'exact' });
        console.log("Exam results count with admin session:", count);
        if (data && data.length > 0) {
            console.log("Sample exam result:", data[0]);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
