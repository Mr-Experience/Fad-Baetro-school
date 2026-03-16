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
/**
 * Checks if a student is ELIGIBLE for promotion (finished all exams in 3rd term)
 * This is used for UI feedback after the last exam.
 */
export const checkPromotionEligibility = async (studentId, currentClassId, sessionId, termId) => {
    const isFinalTerm = termId?.toLowerCase().includes('third');
    if (!isFinalTerm) return { eligible: false, reason: 'Not final term' };

    try {
        const sKey = (sessionId || '').trim();
        const tKey = (termId || '').trim();

        const [subjectsRes, resultsRes] = await Promise.all([
            supabase.from('subjects').select('id').eq('class_id', currentClassId),
            supabase.from('exam_results')
                .select('subject_id')
                .eq('student_id', studentId)
                .eq('class_id', currentClassId)
                .ilike('session_id', sKey)
                .ilike('term_id', tKey)
                .eq('question_type', 'exam')
        ]);

        const classSubjects = subjectsRes.data || [];
        const examResults = resultsRes.data || [];

        if (classSubjects.length === 0) return { eligible: false };

        const completedSubjectIds = new Set(examResults?.map(r => r.subject_id) || []);
        const totalRequired = classSubjects.length;
        const completedCount = classSubjects.filter(s => completedSubjectIds.has(s.id)).length;

        const isEligible = completedCount >= totalRequired;
        
        return { 
            eligible: isEligible, 
            completed: completedCount, 
            total: totalRequired 
        };
    } catch (err) {
        console.error("Eligibility Check Error:", err);
        return { eligible: false };
    }
};

/**
 * MASS PROMOTION: Moves all eligible students to their next classes.
 * Triggered by Super Admin when starting a NEW Session.
 */
export const runBatchPromotion = async (oldSession, oldTerm) => {
    try {
        console.log(`Starting Batch Promotion for ${oldSession} ${oldTerm}...`);
        
        // 1. Get ALL students who haven't graduated
        const { data: students, error: studentErr } = await supabase
            .from('profiles')
            .select('id, class_id, full_name, target_class_id')
            .eq('role', 'student')
            .not('class_id', 'is', null);

        if (studentErr) throw studentErr;

        let promotedCount = 0;
        const promotionResults = [];

        // 2. Map current classes to next classes
        const promotionMap = {
            'JSS 1': 'JSS 2',
            'JSS 2': 'JSS 3',
            // 'JSS 3' mapping removed - must be handled via DepartmentSelection
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

        // Cache for class IDs to avoid redundant lookups
        const classCache = {};
        const { data: allClasses } = await supabase.from('classes').select('id, class_name');
        allClasses?.forEach(c => classCache[c.class_name.toUpperCase()] = c.id);

        for (const student of students) {
            const eligibility = await checkPromotionEligibility(student.id, student.class_id, oldSession, oldTerm);
            
            if (eligibility.eligible) {
                // Determine destination
                const { data: currentClass } = await supabase.from('classes').select('class_name').eq('id', student.class_id).single();
                const className = currentClass?.class_name?.toUpperCase() || '';
                
                let nextClassId = null;

                // Priority 1: Use pre-selected target_class_id (e.g. from JSS 3 manual choice)
                if (student.target_class_id) {
                    nextClassId = student.target_class_id;
                } else if (className !== 'JSS 3') {
                    // Priority 2: Use automatic promotion map
                    const nextName = promotionMap[className];
                    if (nextName === 'PASSEDOUT') {
                        await supabase.from('profiles').update({ role: 'passedout', class_id: null, target_class_id: null }).eq('id', student.id);
                        promotedCount++;
                        continue;
                    } else if (nextName && classCache[nextName]) {
                        nextClassId = classCache[nextName];
                    }
                }

                if (nextClassId) {
                    await supabase.from('profiles').update({ 
                        class_id: nextClassId,
                        target_class_id: null // Clear for next year
                    }).eq('id', student.id);
                    promotedCount++;
                } else {
                    console.log(`Skipping student ${student.full_name} - No target class found.`);
                }
            }
        }

        return { success: true, count: promotedCount };
    } catch (err) {
        console.error("Batch Promotion Failed:", err);
        return { success: false, error: err.message };
    }
};
