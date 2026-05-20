import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read env file manually
const envFile = fs.readFileSync('C:/Users/Kiran Teja/Downloads/My projects/KidenHub/kiden-hub/.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('content_pieces')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error: ", error);
  } else {
    console.log("Keys in content_pieces:", data && data[0] ? Object.keys(data[0]) : "No data");
  }
}
run();
