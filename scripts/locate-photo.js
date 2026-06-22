const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');

const META_FILE = path.join('assets', 'img', 'photography', 'albums.json');
const PHOTO_DIR = path.join('assets', 'img', 'photography');
const albumId = process.argv[2];
const explicitQuery = process.argv.slice(3).join(' ').trim();

function usage() {
  console.error('Usage: npm run photos:locate -- <album-id> [place query]');
  console.error('Example: npm run photos:locate -- 07-2025-南京 "南京, 江苏, 中国"');
}

async function main() {
  if (!albumId) {
    usage();
    process.exitCode = 1;
    return;
  }

  const metadata = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
  let album = metadata[albumId];
  if (!album) {
    const albumDirectory = path.join(PHOTO_DIR, albumId);
    if (!fs.existsSync(albumDirectory) || !fs.statSync(albumDirectory).isDirectory()) {
      console.error(`Unknown album id and folder not found: ${albumId}`);
      console.error(`Available ids: ${Object.keys(metadata).join(', ')}`);
      process.exitCode = 1;
      return;
    }

    album = {
      title: albumId.replace(/^\d+-/, '').replace(/[-_]+/g, ' '),
      location: explicitQuery || '',
      group: 'Travel'
    };
    metadata[albumId] = album;
    console.log(`Creating metadata for new album folder: ${albumId}`);
  }

  const query = explicitQuery || album.location || album.title;
  if (!query) {
    console.error('No search text available. Pass a place query after the album id.');
    process.exitCode = 1;
    return;
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'zh-CN,en');

  console.log(`Searching OpenStreetMap for: ${query}`);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'YihDu.github.io photography locator (https://yihdu.github.io/)'
    }
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed: HTTP ${response.status}`);
  }

  const results = await response.json();
  if (!results.length) {
    console.error('No matching places found. Try a more specific query.');
    process.exitCode = 1;
    return;
  }

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.display_name}`);
    console.log(`   ${result.lat}, ${result.lon}`);
  });

  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question(`Choose 1-${results.length}, or q to cancel: `);
  prompt.close();

  if (answer.trim().toLowerCase() === 'q') return;
  const selected = results[Number(answer) - 1];
  if (!selected) {
    console.error('Invalid selection; no file was changed.');
    process.exitCode = 1;
    return;
  }

  album.latitude = Number(selected.lat);
  album.longitude = Number(selected.lon);
  if (!album.location) album.location = query;
  fs.writeFileSync(META_FILE, `${JSON.stringify(metadata, null, 2)}\n`);

  console.log(`Saved ${album.latitude}, ${album.longitude} to ${albumId}.`);
  console.log('Run `npm run photos` to regenerate the Jekyll data.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
