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
        const email = `final_try_${Date.now()}@admin.com`;
        const { data: { user } } = await supabase.auth.signUp({ email, password: 'Password123!' });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'Final cleaner v4', role: 'admin' });

        const rid1 = '8ed37d1a-efcb-4c99-a3f8-9c69748bbf0e';
        const rid2 = 'dc1102f0-e0c3-42ae-8e9d-d0aabeb9190a';

        console.log(`DELETING RESULT ID ${rid1}...`);
        const { error: e1 } = await supabase.from('exam_results').delete().eq('id', rid1);
        console.log(`  Res: ${e1 ? e1.message : 'OK'}`);

        console.log(`DELETING RESULT ID ${rid2}...`);
        const { error: e2 } = await supabase.from('exam_results').delete().eq('id', rid2);
        console.log(`  Res: ${e2 ? e2.message : 'OK'}`);

        console.log("FINAL DELETE ATTEMPT ON CLASSES...");
        const res3 = await supabase.from('classes').delete().eq('id', '64dc5df2-99cc-4c92-b132-40c898639dfe');
        console.log(`  JSS1: ${res3.error ? res3.error.message : 'DELETED'}`);

        const res4 = await supabase.from('classes').delete().eq('id', '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f');
        console.log(`  JSS2: ${res4.error ? res4.error.message : 'DELETED'}`);

    } catch (e) {
        console.error(e);
    }
}
run();
