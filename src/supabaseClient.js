import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zjkabqcgymxysqgfbbge.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqa2FicWNneW14eXNxZ2ZiYmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTQzNzYsImV4cCI6MjEwMDg3MDM3Nn0.z821_dGCjnS_LZnj6l5mERGtu8wZvkMRDiGURXxFXmY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
