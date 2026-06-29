import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('directorios_web').select('*').limit(1);
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Row keys:', data.length > 0 ? Object.keys(data[0]) : 'Empty table');
    console.log('Row data:', data);
  }
}

check();
