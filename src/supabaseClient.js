import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zjkabqcgymxysqgfbbge.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqa2FicWNneW14eXNxZ2ZiYmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MDMwMTAsImV4cCI6MjEwMjA3OTAxMH0.dummy_or_provided_key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
