const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDomains() {
    const list = ['den@fadmaestro.com', 'den@school.com', 'den@gmail.com', 'den@outlook.com'];
    for (const email of list) {
        console.log(`Checking domain: ${email}`);
        const { error } = await supabase.auth.signUp({ email, password: 'password123' });
        if (error) {
            console.log(`- ${email} FAILED: ${error.message}`);
        } else {
            console.log(`- ${email} SUCCESS! This domain is allowed.`);
            return;
        }
    }
}
checkDomains();
