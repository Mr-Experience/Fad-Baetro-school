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
        const email = `final_pol_v7_${Date.now()}@admin.com`;
        const { data: { user } } = await supabase.auth.signUp({ email, password: 'Password123!' });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'v7 checker', role: 'admin' });

        const cid1 = '64dc5df2-99cc-4c92-b132-40c898639dfe';

        console.log(`Checking JSS1 (ID: ${cid1}) in exam_results AGAIN...`);
        const r1 = await supabase.from('exam_results').select('id, class_id').eq('class_id', cid1);
        console.log(`Count: ${r1.data.length}, Data: ${JSON.stringify(r1.data)}`);
        
        if (r1.data.length > 0) {
            console.log("WAIT - If I just updated it to NULL, why is it still there in the query??");
            console.log("Attempting to SELECT ALL results to see what's really there...");
            const { data: all } = await supabase.from('exam_results').select('id, class_id').limit(10);
            console.log("All results (id/class_id):", all);
        }

    } catch (e) {
        console.error(e);
    }
}
run();
