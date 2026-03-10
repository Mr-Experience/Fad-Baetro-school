const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(url, key);

async function check() {
    console.log("Checking for system_post (singular)...");
    const { data: sing, error: errSing } = await supabase.from('system_post').select('*').limit(1);
    if (errSing) console.log("- system_post error:", errSing.message);
    else console.log("- system_post EXISTS. Columns:", Object.keys(sing[0] || {}));

    console.log("\nChecking for system_posts (plural)...");
    const { data: plur, error: errPlur } = await supabase.from('system_posts').select('*').limit(1);
    if (errPlur) console.log("- system_posts error:", errPlur.message);
    else console.log("- system_posts EXISTS. Columns:", Object.keys(plur[0] || {}));
}
check();
