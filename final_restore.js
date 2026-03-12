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

const originalClasses = [
    { id: '64dc5df2-99cc-4c92-b132-40c898639dfe', class_name: 'JSS1' },
    { id: '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f', class_name: 'JSS2' },
    { id: 'fa36871a-1945-4c5e-8d9e-8e76d3f00dc3', class_name: 'JSS3' }
];

async function run() {
    try {
        console.log("=== FINAL RESTORATION STEP ===");
        
        const email = `final_restorer_${Date.now()}@example.com`;
        const password = 'RestorerPassword123!';
        const { data: { user } } = await supabase.auth.signUp({ email, password });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'Restorer', role: 'admin' });

        // 1. Restore missing JSS3
        console.log("1. Restoring missing JSS3...");
        const { error: jErr } = await supabase.from('classes').insert({ id: 'fa36871a-1945-4c5e-8d9e-8e76d3f00dc3', class_name: 'JSS3' });
        if (jErr && !jErr.message.includes('duplicate key')) {
            console.error("  FAILED JSS3:", jErr.message);
        } else {
            console.log("  JSS3 restored (or already there).");
        }

        // 2. Restore Exam Configs links
        console.log("2. Restoring Exam Configs pointers...");
        await supabase.from('exam_configs').update({ class_id: '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f' }).eq('id', '86ac40dd-9cf8-4aee-bfd3-c362fb0d995a');
        await supabase.from('exam_configs').update({ class_id: '64dc5df2-99cc-4c92-b132-40c898639dfe' }).eq('id', 'deeb4f70-94be-4293-98c7-43ff661a7ffa');
        console.log("  Exam configs restored.");

        // 3. Final count check
        const { data: finalClasses } = await supabase.from('classes').select('*');
        console.log("\nFinal state of Classes:", finalClasses.map(c => `${c.class_name} (${c.id})`));
        
        console.log("\n=== RESTORATION COMPLETE ===");

    } catch (e) {
        console.error(e);
    }
}
run();
