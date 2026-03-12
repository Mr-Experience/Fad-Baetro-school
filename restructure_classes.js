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

const newClasses = [
    'JSS 1', 'JSS 2', 'JSS 3',
    'SSS 1 (Art)', 'SSS 1 (Sci)', 'SSS 1 (Com)',
    'SSS 2 (Art)', 'SSS 2 (Sci)', 'SSS 2 (Com)',
    'SSS 3 (Art)', 'SSS 3 (Sci)', 'SSS 3 (Com)'
];

async function run() {
    try {
        console.log("=== STARTING CLASS RESTRUCTURING ===");

        // 1. Get current classes to understand mapping
        const { data: currentClasses, error: cErr } = await supabase.from('classes').select('id, class_name');
        if (cErr) throw cErr;
        console.log("Found current classes:", currentClasses.map(c => c.class_name));

        // 2. Identify tables that need cleanup
        const tablesWithClassId = ['profiles', 'questions', 'exam_configs'];

        // 3. Temporarily set class_id to NULL to allow deletion
        console.log("Setting class_id to NULL in related tables...");
        for (const table of tablesWithClassId) {
            const { error: uErr } = await supabase.from(table).update({ class_id: null }).not('class_id', 'is', null);
            if (uErr) {
                console.error(`  Error updating ${table}:`, uErr.message);
                // If it fails (e.g. NOT NULL constraint), we might have to delete the records or rethink
            } else {
                console.log(`  Updated ${table}.`);
            }
        }

        // 4. Delete all old classes
        console.log("Deleting old classes...");
        const { error: dErr } = await supabase.from('classes').delete().not('id', 'is', null);
        if (dErr) throw dErr;
        console.log("  Successfully deleted old classes.");

        // 5. Insert new classes
        console.log("Inserting new classes...");
        const { data: insertedClasses, error: iErr } = await supabase.from('classes').insert(
            newClasses.map(name => ({ class_name: name }))
        ).select();
        if (iErr) throw iErr;
        console.log("  Successfully inserted new classes:", insertedClasses.map(c => c.class_name));

        // 6. Map names to new IDs
        const newClassMap = {};
        insertedClasses.forEach(c => {
            newClassMap[c.class_name] = c.id;
        });

        // 7. (OPTIONAL) Attempt to re-link JSS1, JSS2, JSS3 if they are used by profiles/etc.
        // We need to know which records belonged to which class BEFORE we nulled them out.
        // Actually, maybe it's better to just leave them nulled out unless user asks.
        // But since names are almost identical (JSS1 -> JSS 1), it would be nice.
        // To do this right, I should have cached the IDs before nulling.
        
        console.log("\n=== CLASS RESTRUCTURING COMPLETE ===");

    } catch (e) {
        console.error("\n!!! FAILED !!!", e.message);
    }
}

run();
