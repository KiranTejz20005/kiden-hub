import axios from 'axios';
import fs from 'fs';

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

const key = env.VITE_YOUTUBE_API_KEY;

async function run() {
  const uploadsPlaylistId = 'UUUCsBjURrPoezykLs9EqgamOA'; // UU + rest of UC...
  try {
    const playlistRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
      params: {
        part: 'snippet',
        playlistId: 'UUsBjURrPoezykLs9EqgamOA', // UU + rest of UC...
        maxResults: 5,
        key: key
      }
    });
    
    const videoIds = playlistRes.data.items?.map(i => i.snippet.resourceId.videoId).join(',');
    const detailsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet',
        id: videoIds,
        key: key
      }
    });

    for (const item of detailsRes.data.items || []) {
      console.log(`Video: "${item.snippet.title}"`);
      console.log(`Tags:`, item.snippet.tags);
    }
  } catch (err) {
    console.error(err.message);
  }
}

run();
