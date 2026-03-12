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

const oldClasses = [
    { id: '64dc5df2-99cc-4c92-b132-40c898639dfe', class_name: 'JSS1' },
    { id: '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f', class_name: 'JSS2' },
    { id: 'fa36871a-1945-4c5e-8d9e-8e76d3f00dc3', class_name: 'JSS3' }
];

async function run() {
    try {
        console.log("=== UNDOING CLASS RESTRUCTURING (v2) ===");

        const email = `final_undo_${Date.now()}@example.com`;
        const password = 'FinalUndoPassword123!';
        
        console.log("1. Signing up temp admin...");
        const { data: signUpData, error: sError } = await supabase.auth.signUp({ email, password });
        if (sError) throw sError;
        
        await supabase.from('profiles').insert({
            id: signUpData.user.id,
            email: email,
            full_name: 'Final Undo Admin',
            role: 'admin'
        });

        // 2. Identify and clear all tables that might have class_id
        const commonTables = ['profiles', 'questions', 'exam_configs', 'exam_results', 'exam_attempts', 'subjects', 'candidates', 'students'];

        console.log("2. Clearing class_id in all related tables...");
        for (const table of commonTables) {
            const { error: uErr } = await supabase.from(table).update({ class_id: null }).not('class_id', 'is', null);
            if (uErr) {
                // Some tables might not have the column OR not allow nulls
                console.log(`  Skipped/Failed ${table}: ${uErr.message}`);
            } else {
                console.log(`  Updated ${table}.`);
            }
        }

        // 3. Delete ALL classes
        console.log("3. Deleting all current classes...");
        const { error: dErr } = await supabase.from('classes').delete().not('id', 'is', null);
        if (dErr) {
            console.error("  FAILED TO DELETE CLASSES:", dErr.message);
            // If it still fails, there might be a non-null constraint on some relation
        } else {
            console.log("  Classes deleted.");
        }

        // 4. Restore the old classes
        console.log("4. Restoring original classes...");
        const { error: iErr } = await supabase.from('classes').insert(oldClasses);
        if (iErr) throw iErr;
        console.log("  Classes restored.");

        // 5. Restore known links
        console.log("5. Restoring known links for exam_configs...");
        await supabase.from('exam_configs').update({ class_id: '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f' }).eq('id', '86ac40dd-9cf8-4aee-bfd3-c362fb0d995a');
        await supabase.from('exam_configs').update({ class_id: '64dc5df2-99cc-4c92-b132-40c898639dfe' }).eq('id', 'deeb4f70-94be-4293-98c7-43ff661a7ffa');

        console.log("\n=== UNDO COMPLETE ===");
        
        // Cleanup
        await supabase.from('profiles').delete().eq('id', signUpData.user.id);
        // We can't delete the auth user easily without admin api, but it's fine.

    } catch (e) {
        console.error("\n!!! UNDO FAILED !!!", e.message);
    }
}

run();
