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
        const email = `final_check_${Date.now()}@admin.com`;
        const { data: { user } } = await supabase.auth.signUp({ email, password: 'Password123!' });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'Final Checker', role: 'admin' });

        const cidJSS1 = '64dc5df2-99cc-4c92-b132-40c898639dfe';
        const cidJSS2 = '9506d42e-8965-4ab4-8cc1-c1fdf80b5f4f';

        console.log("Checking exam_results count for JSS1...");
        const { count: c1 } = await supabase.from('exam_results').select('*', { count: 'exact', head: true }).eq('class_id', cidJSS1);
        console.log(`Count: ${c1}`);

        console.log("Checking exam_results count for JSS2...");
        const { count: c2 } = await supabase.from('exam_results').select('*', { count: 'exact', head: true }).eq('class_id', cidJSS2);
        console.log(`Count: ${c2}`);

        const { data: anyResults } = await supabase.from('exam_results').select('id, class_id, class_name').limit(5);
        console.log("Any exam results samples:", anyResults);
        
    } catch (e) {
        console.error(e);
    }
}
run();
