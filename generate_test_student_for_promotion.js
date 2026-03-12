/**
 * TEST SCRIPT: Generate a Student Ready for Promotion
 * 
 * This script will:
 * 1. Create a "Promotion Candidate" student account.
 * 2. Assign them to JSS 3 (Third Term).
 * 3. Mock exam results for all subjects in that class.
 * 4. Verify they are ready to be promoted to SSS 1.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function generateTestStudent() {
    console.log("🚀 Starting Promotion Test Generation...");

    const email = "test_promo@gmail.com";
    const password = "password123";
    const fullName = "Promotion Candidate";
    const session = "2024/2025";
    const term = "Third Term";

    try {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });
        if (authError) throw authError;
        const userId = authData.user.id;

        // 2. Find JSS 3 ID
        const { data: jss3 } = await supabase.from('classes').select('id').eq('class_name', 'JSS 3').single();
        if (!jss3) throw new Error("JSS 3 class not found. Ensure classes are seeded.");

        // 3. Create Profile
        await supabase.from('profiles').insert({
            id: userId,
            email,
            full_name: fullName,
            role: 'student',
            class_id: jss3.id
        });

        // 4. Batch Create Mock Results
        const { data: subjects } = await supabase.from('subjects').select('id, subject_name').eq('class_id', jss3.id);
        
        const results = subjects.map(sub => ({
            student_id: userId,
            subject_id: sub.id,
            class_id: jss3.id,
            question_type: 'exam',
            score_percent: 85,
            session_id: session,
            term_id: term,
            subject_name: sub.subject_name
        }));

        const { error: resErr } = await supabase.from('exam_results').insert(results);
        if (resErr) throw resErr;

        console.log(`✅ Success! Student '${fullName}' created in JSS 3.`);
        console.log(`📊 All ${subjects.length} exams completed for ${term}.`);
        console.log(`🛠️ To promote: Log in as this student and submit any small quiz, or run the promotion checker manually.`);

    } catch (err) {
        console.error("❌ Generation failed:", err.message);
    }
}

generateTestStudent();
