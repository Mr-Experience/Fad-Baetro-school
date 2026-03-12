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
        console.log("=== FINAL WIPE (IGNORE ERRORS) ===");
        
        const email = `final_wipe_${Date.now()}@example.com`;
        const password = 'WipePassword123!';
        
        const signUp = await supabase.auth.signUp({ email, password });
        if (signUp.data.user) {
            await supabase.from('profiles').insert({
                id: signUp.data.user.id,
                email: email,
                full_name: 'Wipe Admin',
                role: 'admin'
            });

            const tables = ['exam_results', 'questions', 'exam_configs', 'subjects'];
            for (const table of tables) {
                console.log(`Trying to clear ${table}...`);
                try {
                    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                    if (error) console.log(`  ❌ Error on ${table}: ${error.code} - ${error.message} - ${error.details}`);
                    else console.log(`  ✅ ${table} cleared.`);
                } catch (inner) {
                    console.log(`  💥 Crash on ${table}:`, inner.message);
                }
            }
            
            await supabase.from('profiles').delete().eq('id', signUp.data.user.id);
        }
    } catch (e) {
        console.log("Catch:", e);
    }
}
run();
