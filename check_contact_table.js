const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
let envContent;
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
}

const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log("Checking 'contact_messages' table...");
    const { data, error } = await supabase.from('contact_messages').select('*').limit(5);
    
    if (error) {
        console.error("Error accessing contact_messages table:", error.message);
        console.log("It's possible the table does not exist or RLS is blocking access.");
    } else {
        console.log("Success! Table exists.");
        console.log("Recent messages count:", data.length);
        if (data.length > 0) {
            console.log("Latest message:", JSON.stringify(data[0], null, 2));
        } else {
            console.log("The table is currently empty.");
        }
    }
}

run();
