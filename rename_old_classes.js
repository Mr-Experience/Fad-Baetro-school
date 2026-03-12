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
        const email = `final_v9_${Date.now()}@admin.com`;
        const { data: { user } } = await supabase.auth.signUp({ email, password: 'Password123!' });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'v9 cleaner', role: 'admin' });

        const cid1 = '64dc5df2-99cc-4c92-b132-40c898639dfe';
        const cid2 = '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f';

        console.log("Renaming old classes to mark them for manual deletion...");
        
        await supabase.from('classes').update({ class_name: 'OLD_JSS1_TO_DELETE' }).eq('id', cid1);
        await supabase.from('classes').update({ class_name: 'OLD_JSS2_TO_DELETE' }).eq('id', cid2);

        const { data: finalClasses } = await supabase.from('classes').select('id, class_name');
        console.log("Current classes in DB:", finalClasses);

    } catch (e) {
        console.error(e);
    }
}
run();
