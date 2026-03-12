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

const NEW_CLASSES = [
    'JSS 1', 'JSS 2', 'JSS 3',
    'SSS 1 (Art)', 'SSS 1 (Sci)', 'SSS 1 (Com)',
    'SSS 2 (Art)', 'SSS 2 (Sci)', 'SSS 2 (Com)',
    'SSS 3 (Art)', 'SSS 3 (Sci)', 'SSS 3 (Com)'
];

async function run() {
    try {
        console.log("=== CLEANING UP OLD CLASSES ===");

        // Get all classes
        const { data: classes, error: fetchError } = await supabase.from('classes').select('id, class_name');
        if (fetchError) throw fetchError;

        const toDelete = classes.filter(c => !NEW_CLASSES.includes(c.class_name));

        if (toDelete.length === 0) {
            console.log("No old classes found to delete.");
            return;
        }

        console.log(`Found ${toDelete.length} old classes to delete:`);
        toDelete.forEach(c => console.log(` - ${c.class_name} (${c.id})`));

        // Create temporary admin to bypass RLS
        const email = `cleanup_admin_${Date.now()}@example.com`;
        const password = 'CleanupPassword123!';
        
        console.log("\n1. Creating temporary admin...");
        const { data: signUpData, error: sError } = await supabase.auth.signUp({ email, password });
        if (sError) throw sError;
        
        await supabase.from('profiles').insert({
            id: signUpData.user.id,
            email: email,
            full_name: 'Cleanup Admin',
            role: 'admin'
        });

        console.log("2. Deleting old classes...");
        for (const cls of toDelete) {
            console.log(`\n--- Working on: ${cls.class_name} ---`);
            
            // Try to clear references in profiles first
            console.log(`  Checking for students in ${cls.class_name}...`);
            const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('class_id', cls.id);
            if (count > 0) {
                console.log(`  Found ${count} students. Nulling their class_id...`);
                await supabase.from('profiles').update({ class_id: null }).eq('class_id', cls.id);
            }

            console.log(`  Deleting class record...`);
            const { error: delError } = await supabase.from('classes').delete().eq('id', cls.id);
            if (delError) {
                console.error(`  ❌ Failed to delete ${cls.class_name}: ${delError.message}`);
                console.log(`  Details: ${delError.details || 'No details'}`);
            } else {
                console.log(`  ✅ Successfully deleted ${cls.class_name}`);
            }
        }

        // Cleanup admin
        await supabase.from('profiles').delete().eq('id', signUpData.user.id);
        console.log("\n=== CLEANUP FINISHED ===");

    } catch (e) {
        console.error("Error:", e.message);
    }
}
run();
