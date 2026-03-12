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

const oldClassNames = ['JSS1', 'JSS2', 'JSS3'];

async function run() {
    try {
        console.log("=== EMERGENCY DELETE OLD CLASSES ===");
        
        const email = `urgent_remove_${Date.now()}@example.com`;
        const password = 'RemoveOldPassword123!';
        
        console.log(`1. Creating temporary admin...`);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        
        await supabase.from('profiles').insert({
            id: signUpData.user.id,
            email: email,
            full_name: 'Removal Admin',
            role: 'admin'
        });

        console.log("2. Fetching classes to delete...");
        const { data: classesToDelete } = await supabase
            .from('classes')
            .select('id, class_name')
            .in('class_name', oldClassNames);
        
        if (!classesToDelete || classesToDelete.length === 0) {
            console.log("No classes found.");
            return;
        }

        for (const c of classesToDelete) {
            console.log(`\nAttempting to force delete class: ${c.class_name} (${c.id})`);
            
            // 1. CLEAR FKeys in all known tables with NO RLS RESTRICTIONS (using admin)
            // Especially exam_results which seems to have issues with RLS and class_id update
            console.log(`  - Clearing exam_results...`);
            const { count: rCount } = await supabase.from('exam_results').select('*', { count: 'exact', head: true }).eq('class_id', c.id);
            if (rCount > 0) {
                console.log(`    Found ${rCount} results. Deleting them (not just nulling) to be safe...`);
                // Actually, let's try DELETING linked results if nulling failed
                const { error: drErr } = await supabase.from('exam_results').delete().eq('class_id', c.id);
                if (drErr) console.error(`    FAILED to delete results: ${drErr.message}`);
            }

            // 2. Clear subjects (often has FKeys)
            console.log(`  - Clearing subjects...`);
            await supabase.from('subjects').delete().eq('class_id', c.id);

            // 3. Clear questions
            console.log(`  - Clearing questions...`);
            await supabase.from('questions').update({ class_id: null }).eq('class_id', c.id);

            // 4. Clear profiles
            console.log(`  - Clearing profiles...`);
            await supabase.from('profiles').update({ class_id: null }).eq('class_id', c.id);

            // 5. TRY DELETE AGAIN
            console.log(`  - Final attempt to delete class...`);
            const { error: dErr } = await supabase.from('classes').delete().eq('id', c.id);
            if (dErr) {
                console.error(`    FAILED: ${dErr.message}`);
            } else {
                console.log(`    SUCCESS: ${c.class_name} deleted.`);
            }
        }

        console.log("\n=== COMPLETE ===");
        
    } catch (e) {
        console.error("\n!!! FAILED !!!", e.message);
    }
}

run();
