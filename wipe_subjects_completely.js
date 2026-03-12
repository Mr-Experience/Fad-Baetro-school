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
        console.log("=== TOTAL SUBJECT & DATA WIPE ===");
        
        const email = `wipe_admin_${Date.now()}@example.com`;
        const password = 'WipePassword123!';
        
        console.log("1. Creating temporary admin...");
        const { data: signUpData, error: sError } = await supabase.auth.signUp({ email, password });
        if (sError) throw sError;
        
        await supabase.from('profiles').insert({
            id: signUpData.user.id,
            email: email,
            full_name: 'Wipe Admin',
            role: 'admin'
        });

        console.log("2. Deleting all dependent data...");

        // Order is important for foreign key constraints
        console.log("  - Clearing exam_results...");
        await supabase.from('exam_results').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
        
        console.log("  - Clearing questions...");
        await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        console.log("  - Clearing exam_configs...");
        await supabase.from('exam_configs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        console.log("  - Clearing subjects...");
        const { error: subErr } = await supabase.from('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (subErr) {
             console.error("  Error deleting subjects:", subErr.message);
        } else {
             console.log("  All subjects cleared!");
        }

        console.log("\n=== WIPE COMPLETE ===");
        console.log("You now have a clean slate to add subjects and questions from the Admin Portal.");
        
        // Cleanup
        await supabase.from('profiles').delete().eq('id', signUpData.user.id);

    } catch (e) {
        console.error(e);
    }
}
run();
