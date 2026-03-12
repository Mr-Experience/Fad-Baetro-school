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
        console.log("=== HEALING DATABASE LINKS ===");

        // 1. Get New Class IDs
        const { data: classes } = await supabase.from('classes').select('id, class_name');
        const classMap = {};
        classes.forEach(c => classMap[c.class_name] = c.id);

        const jss1Id = classMap['JSS 1'];
        const jss2Id = classMap['JSS 2'];
        const jss3Id = classMap['JSS 3'];

        if (!jss1Id || !jss2Id || !jss3Id) {
            console.error("New JSS classes not found. Run the class addition script first.");
            return;
        }

        // 2. Get subjects with NULL class_id
        const { data: subjects } = await supabase.from('subjects').select('id, subject_name').is('class_id', null);
        
        if (!subjects || subjects.length === 0) {
            console.log("No subjects found with NULL class_id. Database links might already be healed.");
        } else {
            console.log(`Found ${subjects.length} subjects with NULL class_id. Mapping them back...`);

            // We have 27 subjects (9 unique subjects repeated 3 times)
            // We'll distribute them across JSS 1, 2, 3
            const subNames = [
                'English Language', 'Mathematics', 'Basic Science', 'Basic Technology',
                'Civic Education', 'Social Studies', 'Agricultural Science', 'Computer Studies',
                'Cultural and Creative Arts'
            ];

            // Simple distribution: first 9 to JSS 1, next 9 to JSS 2, next 9 to JSS 3
            // This assumes the order they were originally created in
            for (let i = 0; i < subjects.length; i++) {
                let targetId = null;
                if (i < 9) targetId = jss1Id;
                else if (i < 18) targetId = jss2Id;
                else targetId = jss3Id;

                await supabase.from('subjects').update({ class_id: targetId }).eq('id', subjects[i].id);
                console.log(`  Linked ${subjects[i].subject_name} to ${i < 9 ? 'JSS 1' : i < 18 ? 'JSS 2' : 'JSS 3'}`);
            }
        }

        console.log("\n=== HEALING COMPLETE ===");
        console.log("Note: Students and Questions with nulled class_id still need manual re-linking to their specific NEW classes.");

    } catch (e) {
        console.error(e);
    }
}
run();
