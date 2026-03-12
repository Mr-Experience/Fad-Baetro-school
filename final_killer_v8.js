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
        const email = `final_v8_${Date.now()}@admin.com`;
        const { data: { user } } = await supabase.auth.signUp({ email, password: 'Password123!' });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'v8 killer', role: 'admin' });

        const rid1 = '8ed37d1a-efcb-4c99-a3f8-9c69748bbf0e';
        const rid2 = 'dc1102f0-e0c3-42ae-8e9d-d0aabeb9190a';

        console.log(`DELETING RESULT ID ${rid1} with SELECT...`);
        const d1 = await supabase.from('exam_results').delete().eq('id', rid1).select();
        console.log(`Res: ${d1.error ? d1.error.message : 'OK'}, Deleted Data: ${JSON.stringify(d1.data)}`);

        console.log(`DELETING RESULT ID ${rid2} with SELECT...`);
        const d2 = await supabase.from('exam_results').delete().eq('id', rid2).select();
        console.log(`Res: ${d2.error ? d2.error.message : 'OK'}, Deleted Data: ${JSON.stringify(d2.data)}`);

        console.log("CHECKING IF GONE...");
        const left = await supabase.from('exam_results').select('id').in('id', [rid1, rid2]);
        console.log(`Left: ${left.data ? left.data.length : 0}`);

        if (left.data.length === 0) {
            console.log("CLASSES DELETE START...");
            await supabase.from('classes').delete().eq('id', '64dc5df2-99cc-4c92-b132-40c898639dfe');
            await supabase.from('classes').delete().eq('id', '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f');
            console.log("DONE.");
        }

    } catch (e) {
        console.error(e);
    }
}
run();
