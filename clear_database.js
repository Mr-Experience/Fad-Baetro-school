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

async function clearTable(tableName) {
    console.log(`Clearing table: ${tableName}...`);
    // Delete with a filter that matches everything (ID is not null)
    const { error, count } = await supabase
        .from(tableName)
        .delete()
        .not('id', 'is', null);

    if (error) {
        console.error(`  Error clearing ${tableName}:`, error.message);
    } else {
        console.log(`  Successfully cleared ${tableName}.`);
    }
}

async function run() {
    console.log("=== DATABASE CLEANUP INITIATED ===\n");

    // Order matters if there are foreign key constraints
    // 1. Clear Result/Attempt data first
    await clearTable('exam_results');
    await clearTable('exam_attempts');

    // 2. Clear Configs (Live requests)
    await clearTable('exam_configs');

    // 3. Clear Questions
    await clearTable('questions');

    console.log("\n=== CLEANUP COMPLETE ===");
}

run();
