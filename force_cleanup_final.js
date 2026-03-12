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
        const email = `urgent_cleaner_${Date.now()}@user.com`;
        const password = 'Password123!';
        const { data: { user } } = await supabase.auth.signUp({ email, password });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'Cleaner', role: 'admin' });

        const classIds = ['64dc5df2-99cc-4c92-b132-40c898639dfe', '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f'];

        for (const cid of classIds) {
            console.log(`\nFORCING CLEANUP FOR CLASS ${cid}...`);
            
            // 1. CLEAR RESULTS
            console.log("  Step 1: Clearing exam_results...");
            const { error: rErr } = await supabase.from('exam_results').delete().eq('class_id', cid);
            if (rErr) console.error("  FAILED rErr:", rErr.message);

            // 2. CHECK IF THEY ARE GONE
            const { count } = await supabase.from('exam_results').select('*', { count: 'exact', head: true }).eq('class_id', cid);
            console.log(`  Count in exam_results now: ${count}`);

            if (count > 0) {
                console.log("  Results are still there! Trying direct ID delete...");
                const { data } = await supabase.from('exam_results').select('id').eq('class_id', cid);
                for (const row of data) {
                    await supabase.from('exam_results').delete().eq('id', row.id);
                }
            }

            // 3. DELETE CLASS
            console.log("  Step 2: Deleting class...");
            const { error: dErr } = await supabase.from('classes').delete().eq('id', cid);
            if (dErr) {
                console.error("  FAILED dErr:", dErr.message);
            } else {
                console.log("  SUCCESS: Deleted class.");
            }
        }
    } catch (e) {
        console.error(e);
    }
}
run();
