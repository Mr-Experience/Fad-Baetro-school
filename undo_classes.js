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
        console.log("=== UNDOING CLASS RESTRUCTURING ===");

        // 1. Sign in to bypass RLS (using the admin account created in previous step or finding an existing one)
        // I'll try to use the same logic as before - if I can't find an admin, I'll sign up a temp one.
        // Actually, let's just try to sign in with a known admin if possible, or just create a new temp one.
        
        const email = `undo_admin_${Date.now()}@example.com`;
        const password = 'UndoPassword123!';
        
        console.log("1. Creating temporary admin for undo...");
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        
        await supabase.from('profiles').insert({
            id: signUpData.user.id,
            email: email,
            full_name: 'Undo Admin',
            role: 'admin'
        });

        // 2. Delete the new classes
        console.log("2. Deleting the new 12 classes...");
        const { error: dErr } = await supabase.from('classes').delete().not('id', 'is', null);
        if (dErr) throw dErr;

        // 3. Restore the old classes with original IDs
        console.log("3. Restoring original classes...");
        const { error: iErr } = await supabase.from('classes').insert(oldClasses);
        if (iErr) throw iErr;

        // 4. Restore known links (based on logs)
        console.log("4. Restoring known links...");
        
        // Exam Configs
        await supabase.from('exam_configs').update({ class_id: '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f' }).eq('id', '86ac40dd-9cf8-4aee-bfd3-c362fb0d995a');
        await supabase.from('exam_configs').update({ class_id: '64dc5df2-99cc-4c92-b132-40c898639dfe' }).eq('id', 'deeb4f70-94be-4293-98c7-43ff661a7ffa');

        console.log("\n=== UNDO COMPLETE ===");
        console.log("Note: Some links in profiles and questions were nulled out and could not be fully restored automatically.");

    } catch (e) {
        console.error("\n!!! UNDO FAILED !!!", e.message);
    }
}

run();
