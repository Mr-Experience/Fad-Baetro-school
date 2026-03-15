import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nvbsgzintqxsjcptujld.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YnNnemludHF4c2pjcHR1amxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTczNDYsImV4cCI6MjA4OTA3MzM0Nn0.Zc1uHjqD4AIzYQ5pPHyU4dIDPPq2jUnw_TzLNhcZHMI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error, count } = await supabase.from('classes').select('*', { count: 'exact' });
    console.log("Error:", error);
    console.log("Count:", count);
    console.log("Data:", data);
}

check();
