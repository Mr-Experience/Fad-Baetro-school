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

async function checkColumns(tableName) {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
        console.error(`Error checking ${tableName}:`, error.message);
        return;
    }
    if (data && data.length > 0) {
        console.log(`Columns for ${tableName}:`, Object.keys(data[0]));
    } else {
        console.log(`${tableName} table is empty or could not fetch columns.`);
    }
}

async function run() {
    await checkColumns('classes');
    await checkColumns('students');
    await checkColumns('questions');
    await checkColumns('exam_configs');
}
run();
