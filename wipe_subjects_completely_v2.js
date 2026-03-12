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
        console.log("=== TOTAL SUBJECT & DATA WIPE (V2) ===");
        
        const email = `wipe_v2_${Date.now()}@example.com`;
        const password = 'WipePassword123!';
        
        console.log("1. Creating temporary admin...");
        const signUp = await supabase.auth.signUp({ email, password });
        if (signUp.error) {
            console.error("SignUp Error:", signUp.error.message);
            return;
        }
        
        const user = signUp.data.user;
        const prof = await supabase.from('profiles').insert({
            id: user.id,
            email: email,
            full_name: 'Wipe Admin V2',
            role: 'admin'
        });
        
        if (prof.error) {
            console.error("Profile Insert Error:", prof.error.message);
            return;
        }

        console.log("2. Deleting all dependent data...");

        const tables = ['exam_results', 'questions', 'exam_configs', 'subjects'];
        for (const table of tables) {
            console.log(`  - Clearing ${table}...`);
            const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) console.log(`    ⚠️ Error clearing ${table}: ${error.message}`);
            else console.log(`    ✅ ${table} cleared.`);
        }

        console.log("\n=== WIPE COMPLETE ===");
        
        // Cleanup admin
        await supabase.from('profiles').delete().eq('id', user.id);
        console.log("Temporary admin cleaned up.");

    } catch (e) {
        console.error("Unhandled Exception:", e);
    }
}
run();
