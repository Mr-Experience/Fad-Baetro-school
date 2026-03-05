const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testPermissions() {
    const tables = ['classes', 'subjects', 'questions', 'exam_configs'];

    for (const table of tables) {
        console.log(`\nTesting ${table} permissions:`);

        // Test select
        const { data: selectData, error: selectError } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        console.log(`  SELECT: ${selectError ? '❌ ' + selectError.message : '✅ OK'}`);

        // Test insert (only if select works)
        if (!selectError) {
            let testInsert = {};
            switch(table) {
                case 'classes':
                    testInsert = { class_name: 'TEST_CLASS' };
                    break;
                case 'subjects':
                    testInsert = { subject_name: 'TEST_SUBJECT', class_id: '64dc5df2-99cc-4c92-b132-40c898639dfe' };
                    break;
                case 'questions':
                    testInsert = {
                        class_id: '64dc5df2-99cc-4c92-b132-40c898639dfe',
                        subject_id: '2b100e6b-0071-4c01-abb0-ad618afde2e9',
                        question_text: 'Test question',
                        option_a: 'A',
                        option_b: 'B',
                        option_c: 'C',
                        option_d: 'D',
                        correct_answer: 'A'
                    };
                    break;
                case 'exam_configs':
                    testInsert = {
                        class_id: '64dc5df2-99cc-4c92-b132-40c898639dfe',
                        subject_id: '2b100e6b-0071-4c01-abb0-ad618afde2e9',
                        question_type: 'test',
                        is_active: true
                    };
                    break;
            }

            const { data: insertData, error: insertError } = await supabase
                .from(table)
                .insert(testInsert)
                .select();

            console.log(`  INSERT: ${insertError ? '❌ ' + insertError.message : '✅ OK'}`);

            // Clean up if insert succeeded
            if (!insertError && insertData && insertData.length > 0) {
                await supabase.from(table).delete().eq('id', insertData[0].id);
                console.log(`  CLEANUP: ✅ Removed test record`);
            }
        }
    }
}

testPermissions();