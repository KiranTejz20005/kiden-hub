import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function sanitize() {
  console.log("Fetching all content pieces...");
  const { data, error } = await supabase
    .from('content_pieces')
    .select('id, title, content_metadata');

  if (error) {
    console.error("Fetch error:", error.message);
    return;
  }

  console.log(`Found ${data.length} total content pieces. Checking for stringified metadata...`);
  
  let cleanedCount = 0;
  for (const item of data) {
    if (typeof item.content_metadata === 'string') {
      try {
        const parsed = JSON.parse(item.content_metadata);
        // If it parses into another string (triple-stringified), parse again
        let finalObj = parsed;
        if (typeof parsed === 'string') {
          finalObj = JSON.parse(parsed);
        }
        
        const { error: updateError } = await supabase
          .from('content_pieces')
          .update({ content_metadata: finalObj })
          .eq('id', item.id);
          
        if (updateError) {
          console.error(`Failed to update [${item.title}]:`, updateError.message);
        } else {
          cleanedCount++;
        }
      } catch (err) {
        console.error(`Failed to parse metadata for [${item.title}]:`, err.message);
      }
    }
  }

  console.log(`Sanitization complete! Cleaned ${cleanedCount} records.`);
}

sanitize();
