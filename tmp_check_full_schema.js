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
    const cols = [
        'id', 'class_id', 'subject_id', 'session_id', 'term_id',
        'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
        'correct_answer', 'correct_option', 'options', 'question_type'
    ];

    const { data, error } = await supabase.from('questions').select('*').limit(1);
    if (error) {
        console.log("Error selecting from questions:", error.message);
        return;
    }

    const existingCols = data.length > 0 ? Object.keys(data[0]) : [];

    // If table is empty, we can't get keys this way. Try a trick:
    const { data: colsData, error: colsError } = await supabase.rpc('get_table_columns', { table_name: 'questions' });

    if (colsError) {
        // Fallback: search for each col
        for (const col of cols) {
            const { error: e } = await supabase.from('questions').select(col).limit(1);
            console.log(`Column '${col}': ${e ? 'MISSING' : 'EXISTS'}`);
        }
    } else {
        console.log("Columns:", colsData);
    }
}
run();
