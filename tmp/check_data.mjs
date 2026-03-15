
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://nvbsgzintqxsjcptujld.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YnNnemludHF4c2pjcHR1amxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTczNDYsImV4cCI6MjA4OTA3MzM0Nn0.Zc1uHjqD4AIzYQ5pPHyU4dIDPPq2jUnw_TzLNhcZHMI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log("Checking Subjects Detail...");
  const { data: subjects, error: subError } = await supabase.from('subjects').select('*');
  console.log("Subjects:", JSON.stringify(subjects, null, 2));

  console.log("\nChecking Classes Detail...");
  const { data: classes, error: classesError } = await supabase.from('classes').select('*');
  console.log("Classes:", JSON.stringify(classes, null, 2));
}

checkData();
