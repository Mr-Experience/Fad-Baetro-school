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

const classId = '64dc5df2-99cc-4c92-b132-40c898639dfe';

async function run() {
    try {
        const email = `check_table_${Date.now()}@example.com`;
        const password = 'Password123!';
        const { data: { user } } = await supabase.auth.signUp({ email, password });
        await supabase.from('profiles').insert({ id: user.id, email, full_name: 'Table Checker', role: 'admin' });

        console.log(`Checking table definition for exam_results with class_id: ${classId}`);
        const { data, count } = await supabase.from('exam_results').select('id, class_id, student_id').eq('class_id', classId);
        console.log("Records found in exam_results:", data ? data.length : 0);
        if (data && data.length > 0) {
            console.log("Sample ID:", data[0].id);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
