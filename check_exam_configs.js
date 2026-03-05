const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkExamConfigs() {
    console.log('Checking exam_configs table...');

    // Try to select from exam_configs
    const { data, error } = await supabase.from('exam_configs').select('*').limit(5);

    if (error) {
        console.log('Error accessing exam_configs:', error.message);
        console.log('Table might not exist. Let\'s check what tables are available...');

        // Check some known tables
        const knownTables = ['questions', 'classes', 'subjects', 'students', 'exams'];
        for (const table of knownTables) {
            const { data: tableData, error: tableError } = await supabase.from(table).select('*').limit(1);
            if (tableError) {
                console.log(`Table '${table}': NOT FOUND (${tableError.message})`);
            } else {
                console.log(`Table '${table}': EXISTS`);
            }
        }
    } else {
        console.log('exam_configs table exists!');
        console.log('Sample data:', JSON.stringify(data, null, 2));
        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        }
    }
}

checkExamConfigs();