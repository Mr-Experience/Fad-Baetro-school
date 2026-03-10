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

async function run() {
    console.log("Checking exam_configs table details...");
    const { data: config, error } = await supabase
        .from('exam_configs')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching config:", error.message);
    } else if (config && config.length > 0) {
        console.log("Sample config object:", JSON.stringify(config[0], null, 2));
        console.log("visible_at value:", config[0].visible_at);
        console.log("Parsing test:");
        const d = new Date(config[0].visible_at);
        console.log("  - UTC ISO:", d.toISOString());
        console.log("  - Local Time String:", d.toLocaleTimeString());
    } else {
        console.log("No config found in table.");
    }
}
run();
