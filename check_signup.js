const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://elelmzeszymkszddfwtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZWxtemVzenlta3N6ZGRmd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ4MzQsImV4cCI6MjA4ODExMDgzNH0.NM2fLmzMrcu5vnwxI_nstu3ltVOlac8likwBj-9TBK0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSignup() {
    const email = `test_${Date.now()}@example.com`;
    console.log(`Testing signup with email: ${email}`);
    const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123',
    });
    if (error) {
        console.log(`- SIGNUP FAILED: ${error.message} (status: ${error.status})`);
    } else {
        console.log(`- SIGNUP SUCCESS! User ID: ${data.user.id}`);
    }
}
checkSignup();
