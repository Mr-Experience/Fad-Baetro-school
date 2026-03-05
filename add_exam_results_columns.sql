-- Add new columns to exam_results table for comprehensive metadata storage
-- This enhances audit trail tracking with session, term, and full name information

ALTER TABLE exam_results
ADD COLUMN IF NOT EXISTS session_id TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS term_id TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS class_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS subject_name TEXT DEFAULT '';

-- Optional: Add index for faster queries by session and term
CREATE INDEX IF NOT EXISTS idx_exam_results_session_term 
ON exam_results(session_id, term_id);

-- Optional: Add index for faster queries by class and subject
CREATE INDEX IF NOT EXISTS idx_exam_results_class_subject 
ON exam_results(class_name, subject_name);
