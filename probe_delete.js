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
        console.log("=== SUBJECT DELETE PROBE ===");
        
        const email = `probe_delete_${Date.now()}@example.com`;
        const password = 'WipePassword123!';
        const { data: { user } } = await supabase.auth.signUp({ email, password });
        
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'Admin', role: 'admin' });

        console.log("Attempting to delete subjects table rows...");
        const { error } = await supabase.from('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
            console.log("ERROR CODE:", error.code);
            console.log("ERROR MESSAGE:", error.message);
            console.log("ERROR DETAILS:", error.details);
            console.log("ERROR HINT:", error.hint);
        } else {
            console.log("SUCCESS: All subjects deleted.");
        }

        await supabase.from('profiles').delete().eq('id', user.id);
    } catch (e) {
        console.error("FATAL:", e);
    }
}
run();
