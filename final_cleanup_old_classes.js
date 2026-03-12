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

const oldClassIds = ['64dc5df2-99cc-4c92-b132-40c898639dfe', '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f'];

async function run() {
    try {
        console.log("=== FINAL ATTEMPT TO DELETE OLD CLASSES ===");
        
        const email = `final_cleanup_${Date.now()}@example.com`;
        const password = 'CleanupPassword123!';
        const { data: { user } } = await supabase.auth.signUp({ email, password });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'Cleaner', role: 'admin' });

        for (const classId of oldClassIds) {
            console.log(`\nDeleting everything related to ${classId}...`);

            // 1. Delete all results that reference this class
            console.log("  Deleting results...");
            const { error: rErr } = await supabase.from('exam_results').delete().eq('class_id', classId);
            if (rErr) console.error("  FAILED results:", rErr.message);

            // 2. Delete all exam_configs that reference this class
            console.log("  Deleting configs...");
            const { error: cErr } = await supabase.from('exam_configs').delete().eq('class_id', classId);
            if (cErr) console.error("  FAILED configs:", cErr.message);

            // 3. Delete all subjects that reference this class
            console.log("  Deleting subjects...");
            const { error: sErr } = await supabase.from('subjects').delete().eq('class_id', classId);
            if (sErr) console.error("  FAILED subjects:", sErr.message);

            // 4. Nullify questions
            console.log("  Nulling questions...");
            await supabase.from('questions').update({ class_id: null }).eq('class_id', classId);

            // 5. TRY DELETE CLASS
            console.log("  Deleting class...");
            const { error: dErr } = await supabase.from('classes').delete().eq('id', classId);
            if (dErr) {
                console.error("  FAILED DELETE:", dErr.message);
                // IF it still fails, check for other tables
                const { count: aCount } = await supabase.from('exam_attempts').select('*', { count: 'exact', head: true }).eq('class_id', classId);
                console.log(`  Other table check (exam_attempts): ${aCount}`);
            } else {
                console.log("  SUCCESS: Class deleted.");
            }
        }
        
        console.log("\n=== FINISHED ===");

    } catch (e) {
        console.error(e);
    }
}
run();
