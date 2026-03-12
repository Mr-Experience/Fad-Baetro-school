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
        const email = `final_nuller_${Date.now()}@admin.com`;
        const { data: { user } } = await supabase.auth.signUp({ email, password: 'Password123!' });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'v6 nuller', role: 'admin' });

        const cid1 = '64dc5df2-99cc-4c92-b132-40c898639dfe';
        const cid2 = '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f';

        console.log("NULLING class_id in exam_results for JSS1...");
        const n1 = await supabase.from('exam_results').update({ class_id: null }).eq('class_id', cid1);
        console.log(`Res: ${n1.error ? n1.error.message : 'OK'}`);

        console.log("NULLING class_id in exam_results for JSS2...");
        const n2 = await supabase.from('exam_results').update({ class_id: null }).eq('class_id', cid2);
        console.log(`Res: ${n2.error ? n2.error.message : 'OK'}`);

        console.log("DELETING CLASSES...");
        const d1 = await supabase.from('classes').delete().eq('id', cid1);
        console.log(`JSS1: ${d1.error ? d1.error.message : 'DELETED'}`);

        const d2 = await supabase.from('classes').delete().eq('id', cid2);
        console.log(`JSS2: ${d2.error ? d2.error.message : 'DELETED'}`);

    } catch (e) {
        console.error(e);
    }
}
run();
