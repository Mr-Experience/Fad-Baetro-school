import { supabase } from '../supabaseClient';

/**
 * Checks if a student has completed all required exams for their current class/term
 * and promotes them to the next class if eligible.
 * 
 * @param {string} studentId - The ID of the student (profile.id)
 * @param {string} currentClassId - The current class ID of the student
 * @param {string} sessionId - The current academic session (e.g., '2024/2025')
 * @param {string} termId - The current term (e.g., 'Third Term')
 */
export const checkAndPromoteStudent = async (studentId, currentClassId, sessionId, termId) => {
    // Only aid promotion if it's the Third Term (Final Term for most schools)
    // and if the current term is specifically 'Third Term'
    const isFinalTerm = termId?.toLowerCase().includes('third');
    if (!isFinalTerm) return { promoted: false, reason: 'Not final term' };

    try {
        // 1. Get current class name
        const { data: currentClass, error: classErr } = await supabase
            .from('classes')
            .select('class_name')
            .eq('id', currentClassId)
            .maybeSingle();

        if (classErr || !currentClass) return { promoted: false, reason: 'Current class not found' };

        // 2. Define Promotion Path
        const promotionMap = {
            'JSS 1': 'JSS 2',
            'JSS 2': 'JSS 3',
            'JSS 3': 'SSS 1 (Art)', // Default path, can be adjusted by admin later
            'SSS 1 (Art)': 'SSS 2 (Art)',
            'SSS 1 (Sci)': 'SSS 2 (Sci)',
            'SSS 1 (Com)': 'SSS 2 (Com)',
            'SSS 2 (Art)': 'SSS 3 (Art)',
            'SSS 2 (Sci)': 'SSS 3 (Sci)',
            'SSS 2 (Com)': 'SSS 3 (Com)',
            'SSS 3 (Art)': 'PASSEDOUT',
            'SSS 3 (Sci)': 'PASSEDOUT',
            'SSS 3 (Com)': 'PASSEDOUT',
        };

        const nextClassName = promotionMap[currentClass.class_name];
        if (!nextClassName) return { promoted: false, reason: 'No promotion path defined for this class' };

        // 3. Check for all subjects completion
        // Find all subjects assigned to this class
        const { data: classSubjects, error: subErr } = await supabase
            .from('subjects')
            .select('id')
            .eq('class_id', currentClassId);

        if (subErr || !classSubjects || classSubjects.length === 0) {
            return { promoted: false, reason: 'No subjects found for this class' };
        }

        // Find all EXAM results for this student in this term
        const { data: examResults, error: resErr } = await supabase
            .from('exam_results')
            .select('subject_id')
            .eq('student_id', studentId)
            .eq('class_id', currentClassId)
            .eq('session_id', sessionId)
            .eq('term_id', termId)
            .eq('question_type', 'exam');

        if (resErr) return { promoted: false, reason: 'Error fetching exam results' };

        const completedSubjectIds = new Set(examResults?.map(r => r.subject_id) || []);
        const totalRequired = classSubjects.length;
        const completedCount = classSubjects.filter(s => completedSubjectIds.has(s.id)).length;

        console.log(`Promotion Check for student ${studentId}: ${completedCount}/${totalRequired} subjects completed.`);

        const allSubjectsCompleted = completedCount >= totalRequired;

        if (!allSubjectsCompleted) {
            return { promoted: false, reason: `Subjects remaining: ${totalRequired - completedCount}` };
        }

        // 4. Execute Promotion
        if (nextClassName === 'PASSEDOUT') {
            const { error: promoErr } = await supabase
                .from('profiles')
                .update({
                    role: 'passedout',
                    class_id: null // Clear class ID for graduates
                })
                .eq('id', studentId);

            if (promoErr) throw promoErr;
            return { promoted: true, nextClass: 'PASSEDOUT' };
        } else {
            // Find the ID of the next class
            const { data: nextClass, error: nClassErr } = await supabase
                .from('classes')
                .select('id')
                .eq('class_name', nextClassName)
                .maybeSingle();

            if (nClassErr || !nextClass) {
                return { promoted: false, reason: `Next class (${nextClassName}) not found in database` };
            }

            const { error: promoErr } = await supabase
                .from('profiles')
                .update({
                    class_id: nextClass.id
                })
                .eq('id', studentId);

            if (promoErr) throw promoErr;
            return { promoted: true, nextClass: nextClassName };
        }

    } catch (err) {
        console.error("Promotion Error:", err);
        return { promoted: false, error: err.message };
    }
};
