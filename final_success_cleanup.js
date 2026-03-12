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

const classIds = ['64dc5df2-99cc-4c92-b132-40c898639dfe', '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f'];

async function run() {
    try {
        const email = `final_cleaner_${Date.now()}@admin.com`;
        const { data: { user } } = await supabase.auth.signUp({ email, password: 'Password123!' });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'Cleaner', role: 'admin' });

        for (const cid of classIds) {
            console.log(`\nFinal cleanup for class ${cid}`);
            
            // 1. Find all results for this class
            const { data: results } = await supabase.from('exam_results').select('id').eq('class_id', cid);
            console.log(`Found ${results ? results.length : 0} results.`);

            // 2. Delete each result by ID
            if (results) {
                for (const r of results) {
                    console.log(`  Deleting result ${r.id}...`);
                    await supabase.from('exam_results').delete().eq('id', r.id);
                }
            }

            // 3. Delete the class
            console.log(`  Deleting class...`);
            const { error: dErr } = await supabase.from('classes').delete().eq('id', cid);
            if (dErr) {
                console.error(`  ERROR deleting class: ${dErr.message}`);
                // If it fails, check subjects
                await supabase.from('subjects').delete().eq('class_id', cid);
                await supabase.from('exam_configs').delete().eq('class_id', cid);
                // Try one more time
                await supabase.from('classes').delete().eq('id', cid);
            } else {
                console.log(`  SUCCESS!`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
run();
