import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://shrbyzfjqwcikyzydjom.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GCFFQ5ODoZA10s1JKooYxw_NTQxGhHk';

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
