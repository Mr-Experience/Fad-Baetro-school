const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    try {
        console.log("--- System Settings ---");
        const { data: settings, error: sErr } = await supabase.from('system_settings').select('*').eq('id', 1).maybeSingle();
        if (sErr) console.error("Settings Error:", sErr);
        console.log(settings);

        console.log("\n--- Classes Count ---");
        const { count: classCount, error: cErr } = await supabase.from('classes').select('*', { count: 'exact', head: true });
        if (cErr) console.error("Classes Error:", cErr);
        console.log(`Classes: ${classCount}`);

        console.log("\n--- Sample Classes ---");
        const { data: classes } = await supabase.from('classes').select('*').limit(3);
        console.log(classes);

        console.log("\n--- Subjects Count ---");
        const { count: subjectCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
        console.log(`Subjects: ${subjectCount}`);

        console.log("\n--- Questions Counts ---");
        const { data: qSample } = await supabase.from('questions').select('*').limit(5);
        console.log("Sample Questions (ids, sessions, terms):");
        console.log(qSample?.map(q => ({ id: q.id, session: q.session_id, term: q.term_id })));

        console.log("\n--- Exam Configs ---");
        const { data: configs } = await supabase.from('exam_configs').select('*').limit(5);
        console.log(configs);

        console.log("\n--- Students Count ---");
        const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        console.log(`Students: ${studentCount}`);

        const { data: studentSample } = await supabase.from('students').select('id, email, class_id').limit(3);
        console.log("Sample Students:", studentSample);

    } catch (e) {
        console.error("DEBUG SCRIPT FAILED:", e);
    }
}

checkData();
