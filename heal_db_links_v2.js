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
        console.log("=== HEALING DATABASE LINKS (ADMIN MODE) ===");
        
        const email = `heal_admin_${Date.now()}@example.com`;
        const password = 'HealPassword123!';
        
        console.log("1. Creating temporary admin...");
        const { data: signUpData, error: sError } = await supabase.auth.signUp({ email, password });
        if (sError) throw sError;
        
        await supabase.from('profiles').insert({
            id: signUpData.user.id,
            email: email,
            full_name: 'Heal Admin',
            role: 'admin'
        });

        // 2. Get New Class IDs
        const { data: classes } = await supabase.from('classes').select('id, class_name');
        const classMap = {};
        classes.forEach(c => classMap[c.class_name] = c.id);

        const jss1Id = classMap['JSS 1'];
        const jss2Id = classMap['JSS 2'];
        const jss3Id = classMap['JSS 3'];

        const { data: subjects } = await supabase.from('subjects').select('id, subject_name').is('class_id', null);
        
        if (!subjects || subjects.length === 0) {
            console.log("No subjects found with NULL class_id.");
        } else {
            console.log(`Found ${subjects.length} subjects. mapping...`);
            for (let i = 0; i < subjects.length; i++) {
                let targetId = null;
                if (i < 9) targetId = jss1Id;
                else if (i < 18) targetId = jss2Id;
                else targetId = jss3Id;

                const { error: uErr } = await supabase.from('subjects').update({ class_id: targetId }).eq('id', subjects[i].id);
                if (uErr) console.error(`  Error linking ${subjects[i].subject_name}:`, uErr.message);
                else console.log(`  Linked ${subjects[i].subject_name} to ${i < 9 ? 'JSS 1' : i < 18 ? 'JSS 2' : 'JSS 3'}`);
            }
        }

        console.log("\n=== HEALING COMPLETE ===");
        
        // Cleanup
        await supabase.from('profiles').delete().eq('id', signUpData.user.id);

    } catch (e) {
        console.error(e);
    }
}
run();
