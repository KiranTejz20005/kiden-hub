import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function testSort() {
  console.log("Querying content_pieces sorted by content_metadata->>published_at...");
  const { data, error } = await supabase
    .from('content_pieces')
    .select('title, content_metadata')
    .order('content_metadata->>published_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Sort error:", error.message);
  } else {
    console.log("Sort Results:");
    data.forEach(item => {
      console.log(`- ${item.title} (Published: ${item.content_metadata?.published_at})`);
    });
  }
}

testSort();
