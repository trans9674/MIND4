import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sqntjpfclvzghigqwjxw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbnRqcGZjbHZ6Z2hpZ3F3anh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTYxNTUsImV4cCI6MjA3OTk5MjE1NX0.9FBqlBdG5bpQNymvS-hjQXQ3299FUxp5CWljdvJ5TTk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
