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
        console.log("Testing role update...");
        // I need an ID. I'll pick one from the profiles.
        const { data: profile } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
        if (!profile) {
            console.log("No profile found to test.");
            return;
        }
        
        const { error } = await supabase.from('profiles').update({ role: 'passedout' }).eq('id', profile.id);
        if (error) {
            console.log("Update failed (likely constraint):", error.message);
        } else {
            console.log("Update succeeded! Role 'passedout' is allowed.");
            // Revert
            await supabase.from('profiles').update({ role: 'student' }).eq('id', profile.id);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
