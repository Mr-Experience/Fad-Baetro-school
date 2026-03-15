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
        // 1. OMNI-RESOURCES: Fetch everything needed for the check in parallel
        const sKey = (sessionId || '').trim();
        const tKey = (termId || '').trim();

        const [classRes, subjectsRes, resultsRes] = await Promise.all([
            supabase.from('classes').select('class_name').eq('id', currentClassId).maybeSingle(),
            supabase.from('subjects').select('id').eq('class_id', currentClassId),
            supabase.from('exam_results')
                .select('subject_id')
                .eq('student_id', studentId)
                .eq('class_id', currentClassId)
                .ilike('session_id', sKey)
                .ilike('term_id', tKey)
                .eq('question_type', 'exam')
        ]);

        if (classRes.error || !classRes.data) return { promoted: false, reason: 'Current class metadata not found' };
        
        const currentClass = classRes.data;
        const classSubjects = subjectsRes.data || [];
        const examResults = resultsRes.data || [];

        if (classSubjects.length === 0) {
            return { promoted: false, reason: 'No subjects found for this class in curriculum' };
        }

        // 2. Define Promotion Path (Synced with database_setup.sql names)
        const promotionMap = {
            'JSS 1': 'JSS 2',
            'JSS 2': 'JSS 3',
            'JSS 3': 'SSS 1 SCI', // Default transition, can be adjusted by admin later if needed
            'SSS 1 ART': 'SSS 2 ART',
            'SSS 1 COM': 'SSS 2 COM',
            'SSS 1 SCI': 'SSS 2 SCI',
            'SSS 2 ART': 'SSS 3 ART',
            'SSS 2 COM': 'SSS 3 COM',
            'SSS 2 SCI': 'SSS 3 SCI',
            'SSS 3 ART': 'PASSEDOUT',
            'SSS 3 COM': 'PASSEDOUT',
            'SSS 3 SCI': 'PASSEDOUT',
        };

        const nextClassName = promotionMap[currentClass.class_name.toUpperCase()];
        if (!nextClassName) return { promoted: false, reason: `No promotion path defined for ${currentClass.class_name}` };

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
