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
        const email = `check_v5_${Date.now()}@admin.com`;
        const { data: { user } } = await supabase.auth.signUp({ email, password: 'Password123!' });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'v5 checker', role: 'admin' });

        const cid1 = '64dc5df2-99cc-4c92-b132-40c898639dfe';
        const cid2 = '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f';

        console.log(`Checking JSS1 (ID: ${cid1}) in exam_results...`);
        const r1 = await supabase.from('exam_results').select('*', { count: 'exact' }).eq('class_id', cid1);
        console.log(`Count: ${r1.count}, Rows: ${JSON.stringify(r1.data)}`);

        console.log(`Checking JSS2 (ID: ${cid2}) in exam_results...`);
        const r2 = await supabase.from('exam_results').select('*', { count: 'exact' }).eq('class_id', cid2);
        console.log(`Count: ${r2.count}, Rows: ${JSON.stringify(r2.data)}`);

    } catch (e) {
        console.error(e);
    }
}
run();
