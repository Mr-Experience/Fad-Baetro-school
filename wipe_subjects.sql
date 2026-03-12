-- RUN THIS IN SUPABASE SQL EDITOR TO CLEAR OLD SUBJECT DATA COMPLETELY
-- This will wipe all subjects and everything linked to them (Results, Questions, Configs)

TRUNCATE TABLE exam_results CASCADE;
TRUNCATE TABLE questions CASCADE;
TRUNCATE TABLE exam_configs CASCADE;
TRUNCATE TABLE subjects CASCADE;

-- If you want to keep the table structure but remove ALL subjects:
-- DELETE FROM exam_results;
-- DELETE FROM questions;
-- DELETE FROM exam_configs;
-- DELETE FROM subjects;
