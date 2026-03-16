import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nvbsgzintqxsjcptujld.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YnNnemludHF4c2pjcHR1amxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTczNDYsImV4cCI6MjA4OTA3MzM0Nn0.Zc1uHjqD4AIzYQ5pPHyU4dIDPPq2jUnw_TzLNhcZHMI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { data: classes } = await supabase.from('classes').select('*');
    console.log('Classes:', JSON.stringify(classes, null, 2));
}

check();
