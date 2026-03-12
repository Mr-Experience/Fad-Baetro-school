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

async function countTable(tableName) {
    const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
    if (error) {
        console.error(`Error counting ${tableName}:`, error.message);
        return 0;
    }
    console.log(`Count of ${tableName}: ${count}`);
    return count;
}

async function run() {
    await countTable('classes');
    await countTable('profiles');
    await countTable('questions');
    await countTable('exam_configs');
    await countTable('exam_results');
    await countTable('exam_attempts');
}
run();
