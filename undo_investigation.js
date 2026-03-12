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
        const email = `undo_v3_${Date.now()}@example.com`;
        const password = 'UndoPassword123!';
        const { data: { user } } = await supabase.auth.signUp({ email, password });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'Undoer', role: 'admin' });

        const { data: classes } = await supabase.from('classes').select('id, class_name');
        console.log("Current classes count:", classes ? classes.length : 0);
        
        for (const c of classes) {
            console.log(`Attempting to delete class: ${c.class_name} (${c.id})...`);
            const { error: dErr } = await supabase.from('classes').delete().eq('id', c.id);
            if (dErr) {
                console.log(`  FAILED: ${dErr.message}`);
                // Let's check what points here
                const { count: eCount } = await supabase.from('exam_results').select('*', { count: 'exact', head: true }).eq('class_id', c.id);
                console.log(`  exam_results records with this ID: ${eCount}`);
                
                const { count: sCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('class_id', c.id);
                console.log(`  subjects records with this ID: ${sCount}`);
            } else {
                console.log(`  SUCCESS.`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
run();
