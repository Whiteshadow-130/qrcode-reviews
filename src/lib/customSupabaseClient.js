import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvhelqssodcwkfjqszll.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aGVscXNzb2Rjd2tmanFzemxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjYwMDUsImV4cCI6MjA2OTM0MjAwNX0.NRsBEo_vKt-m1cMLpq8CL4x5NqbbKtkEXQQ1_ocnWog';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);