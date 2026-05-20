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

const PREMIUM_CHANNELS_TO_SEARCH = {
  'Education': [
    'Kurzgesagt', 'TED-Ed', '3Blue1Brown', 'Veritasium', 'Vsauce', 'CrashCourse', 'Wendover Productions'
  ],
  'Technology': [
    'Fireship', 'Theo - t3.gg', 'ByteByteGo', 'Hussein Nasser', 'Primeagen', 'Traversy Media', 'Jack Herrington'
  ],
  'Productivity': [
    'Ali Abdaal', 'Thomas Frank', 'Matt D\'Avella', 'Mike and Matty', 'Tiago Forte', 'Keep Productive'
  ],
  'Self-Improvement': [
    'Andrew Huberman', 'Lex Fridman', 'Jordan Peterson', 'Mark Manson', 'Improvement Pill', 'Better Ideas'
  ],
  'Science': [
    'Mark Rober', 'Real Engineering', 'PBS Space Time', 'SciShow'
  ],
  'Business': [
    'Y Combinator', 'Patrick Boyle', 'Plain Bagel', 'Garry Tan', 'How Money Works', 'Slidebean'
  ],
  'Design': [
    'Flux Academy', 'Jesse Showalter', 'The Futur', 'DesignCourse', 'Figma'
  ],
  'Philosophy': [
    'Academy of Ideas', 'Einzelgänger', 'Pursuit of Wonder', 'Like Stories of Old', 'Philosophize This!'
  ],
  'Startups': [
    'Dalton Caldwell', 'TechCrunch', 'First Round Capital', 'a16z', 'Sequoia'
  ],
  'Content creation': [
    'Sean Cannell', 'Colin and Samir', 'Roberto Blake', 'Think Media', 'Cathrin Manning'
  ],
  'Coding': [
    'freeCodeCamp', 'Programming with Mosh', 'Kevin Powell', 'Web Dev Simplified', 'Hitesh Choudhary', 'Code with Harry'
  ]
};

async function searchChannel(name) {
  try {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: name,
        type: 'channel',
        maxResults: 1,
        key: key
      }
    });
    const item = res.data?.items?.[0];
    if (item) {
      return { name, id: item.snippet.channelId, foundName: item.snippet.channelTitle };
    }
  } catch (err) {
    console.error(`Error searching for ${name}:`, err.message);
  }
  return null;
}

async function run() {
  const result = {};
  for (const [category, list] of Object.entries(PREMIUM_CHANNELS_TO_SEARCH)) {
    result[category] = [];
    console.log(`Searching for category: ${category}`);
    for (const name of list) {
      const channelInfo = await searchChannel(name);
      if (channelInfo) {
        result[category].push({ name: channelInfo.name, id: channelInfo.id });
        console.log(`  - "${name}" -> "${channelInfo.foundName}" (${channelInfo.id})`);
      } else {
        console.log(`  - "${name}" -> NOT FOUND`);
      }
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  fs.writeFileSync('scratch/channels-resolved.json', JSON.stringify(result, null, 2));
  console.log("\nFinished. Results written to scratch/channels-resolved.json");
}

run();
