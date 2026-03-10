const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(url, key);

async function check() {
    console.log("Checking hero_images...");
    const { data: hero, error: errHero } = await supabase.from('hero_images').select('*').limit(1);
    if (errHero) console.log("- hero_images error:", errHero.message);
    else console.log("- FOUND hero_images. Columns:", Object.keys(hero[0] || {}));

    console.log("\nChecking media_items...");
    const { data: media, error: errMedia } = await supabase.from('media_items').select('*').limit(1);
    if (errMedia) console.log("- media_items error:", errMedia.message);
    else console.log("- FOUND media_items. Columns:", Object.keys(media[0] || {}));

    console.log("\nChecking media_item...");
    const { data: mitem, error: errMitem } = await supabase.from('media_item').select('*').limit(1);
    if (errMitem) console.log("- media_item error:", errMitem.message);
    else console.log("- FOUND media_item (singular). Columns:", Object.keys(mitem[0] || {}));
}
check();
