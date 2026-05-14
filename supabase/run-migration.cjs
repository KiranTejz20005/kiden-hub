/**
 * KIDEN HUB — Auto Migration Runner
 * Runs the multimodal feed migration via Supabase Management API
 * Run: node run-migration.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

// Read from .env
const envFile = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match ? match[1].trim() : null;
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
// We need the service role key — add VITE_SUPABASE_SERVICE_KEY to .env if available
// Otherwise the migration must be run manually in Supabase SQL Editor
const SERVICE_KEY = getEnv('VITE_SUPABASE_SERVICE_KEY') || getEnv('SUPABASE_SERVICE_KEY');

if (!SERVICE_KEY) {
  console.log('\n⚠️  No service key found. Please run the migration manually:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/bliamtubhvdcoboxtgqh/sql/new');
  console.log('2. Paste contents of: supabase/migrations/20260514_multimodal_feed.sql');
  console.log('3. Click RUN\n');
  process.exit(0);
}

const sqlFile = path.join(__dirname, '../supabase/migrations/20260514_multimodal_feed.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
const body = JSON.stringify({ sql_query: sql });

const req = https.request({
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Length': Buffer.byteLength(body),
  },
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.error('❌ Migration failed:', res.statusCode, data);
      console.log('\nPlease run manually in Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/bliamtubhvdcoboxtgqh/sql/new');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
  console.log('\nPlease run manually in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/bliamtubhvdcoboxtgqh/sql/new');
});

req.write(body);
req.end();
