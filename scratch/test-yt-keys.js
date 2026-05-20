import axios from 'axios';
import fs from 'fs';

// Read env file manually
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const key1 = env.VITE_YOUTUBE_API_KEY;
const key2 = env.VITE_YOUTUBE_API_KEY_2;

async function testKey(keyName, keyVal) {
  if (!keyVal) {
    console.log(`Key ${keyName} is not configured.`);
    return;
  }
  console.log(`Testing ${keyName}: ${keyVal.slice(0, 10)}...`);
  try {
    const url = 'https://www.googleapis.com/youtube/v3/channels';
    const res = await axios.get(url, {
      params: {
        part: 'snippet,statistics',
        id: 'UCsXVk37bltHxD1rDPwtNM8Q',
        key: keyVal
      }
    });
    console.log(`✅ ${keyName} is VALID! Channel: ${res.data?.items?.[0]?.snippet?.title}`);
  } catch (err) {
    console.error(`❌ ${keyName} FAILED:`, err.response?.data?.error || err.message);
  }
}

async function run() {
  await testKey('VITE_YOUTUBE_API_KEY', key1);
  await testKey('VITE_YOUTUBE_API_KEY_2', key2);
}

run();
