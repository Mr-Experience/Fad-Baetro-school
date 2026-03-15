
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://nvbsgzintqxsjcptujld.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YnNnemludHF4c2pjcHR1amxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTczNDYsImV4cCI6MjA4OTA3MzM0Nn0.Zc1uHjqD4AIzYQ5pPHyU4dIDPPq2jUnw_TzLNhcZHMI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { count, error } = await supabase.from('exam_results').select('*', { count: 'exact', head: true });
  console.log("Exam Results Count:", count);
  
  const { count: cCount, error: cError } = await supabase.from('classes').select('*', { count: 'exact', head: true });
  console.log("Classes Count:", cCount);

  const { data: profiles, error: pError } = await supabase.from('profiles').select('id, email, role');
  console.log("Profiles found:", profiles?.length);
  console.log("Profiles sample:", profiles?.slice(0, 5));
}

checkData();
