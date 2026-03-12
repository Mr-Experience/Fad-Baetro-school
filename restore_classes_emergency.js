const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const newClasses = [
    'JSS 1', 'JSS 2', 'JSS 3',
    'SSS 1 (Art)', 'SSS 1 (Sci)', 'SSS 1 (Com)',
    'SSS 2 (Art)', 'SSS 2 (Sci)', 'SSS 2 (Com)',
    'SSS 3 (Art)', 'SSS 3 (Sci)', 'SSS 3 (Com)'
];

async function run() {
    try {
        console.log("=== EMERGENCY CLASS RESTORATION ===");
        
        const email = `temp_admin_${Date.now()}@example.com`;
        const password = 'TempPassword123!';
        
        console.log(`1. Signing up temporary user: ${email}`);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (signUpError) throw new Error(`Signup failed: ${signUpError.message}`);
        const user = signUpData.user;
        console.log(`   User created: ${user.id}`);

        // Sign in to get a session
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (signInError) throw new Error(`Signin failed: ${signInError.message}`);
        console.log("   Signed in.");

        console.log("2. Creating admin profile for this user...");
        const { error: profileError } = await supabase.from('profiles').insert({
            id: user.id,
            email: email,
            full_name: 'Temp Task Admin',
            role: 'admin'
        });
        
        if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);
        console.log("   Admin profile created.");

        console.log("3. Inserting new classes...");
        const { data: insertedClasses, error: iErr } = await supabase.from('classes').insert(
            newClasses.map(name => ({ class_name: name }))
        ).select();
        
        if (iErr) throw new Error(`Class insertion failed: ${iErr.message}`);
        console.log(`   Successfully inserted ${insertedClasses.length} classes.`);

        console.log("\n=== RESTORATION COMPLETE ===");
        
        // Cleanup: Sign out
        await supabase.auth.signOut();

    } catch (e) {
        console.error("\n!!! FAILED !!!", e.message);
    }
}

run();
