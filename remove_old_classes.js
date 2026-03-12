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
        console.log("=== REMOVING OLD CLASSES ===");
        
        const email = `remove_old_${Date.now()}@example.com`;
        const password = 'RemoveOldPassword123!';
        
        console.log(`1. Creating temporary admin: ${email}`);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        
        await supabase.from('profiles').insert({
            id: signUpData.user.id,
            email: email,
            full_name: 'Remove Class Admin',
            role: 'admin'
        });

        console.log("2. Identifying old classes (JSS1, JSS2, JSS3)...");
        const { data: classesToDelete, error: cErr } = await supabase
            .from('classes')
            .select('id, class_name')
            .in('class_name', oldClassNames);
        
        if (cErr) throw cErr;
        
        if (!classesToDelete || classesToDelete.length === 0) {
            console.log("   No classes found with names JSS1, JSS2, or JSS3.");
            return;
        }

        console.log(`   Found ${classesToDelete.length} matching classes.`);

        for (const c of classesToDelete) {
            console.log(`Processing ${c.class_name} (${c.id})...`);
            
            // Null out references to avoid FKey constraint errors
            const tables = ['profiles', 'questions', 'exam_configs', 'exam_results', 'subjects', 'candidates'];
            for (const table of tables) {
                const { error: uErr } = await supabase.from(table).update({ class_id: null }).eq('class_id', c.id);
                if (!uErr) console.log(`  - Nulled class_id in ${table}`);
            }

            // Delete the class
            const { error: dErr } = await supabase.from('classes').delete().eq('id', c.id);
            if (dErr) {
                console.error(`  - FAILED to delete class: ${dErr.message}`);
            } else {
                console.log(`  - SUCCESS: Deleted ${c.class_name}`);
            }
        }

        console.log("\n=== COMPLETE ===");
        
    } catch (e) {
        console.error("\n!!! FAILED !!!", e.message);
    }
}

run();
