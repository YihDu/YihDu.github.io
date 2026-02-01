const fs = require('fs');
const path = require('path');

const PHOTO_DIR = 'assets/img/photography';
const OUTPUT_FILE = 'assets/js/gallery-data.js';

// Load existing data if exists
let existingGalleries = [];
if (fs.existsSync(OUTPUT_FILE)) {
    try {
        const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
        const match = content.match(/const galleries = (\[[\s\S]*\]);/);
        if (match) {
            existingGalleries = JSON.parse(match[1]);
            console.log(`Loaded ${existingGalleries.length} existing galleries`);
        }
    } catch (e) {
        console.log('Could not load existing data, starting fresh');
    }
}

function scanDirectory(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    const galleries = [];

    for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
            const files = fs.readdirSync(fullPath)
                .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
                .sort();

            if (files.length === 0) continue;

            // Check if gallery already exists
            const galleryId = item.name.toLowerCase().replace(/\s+/g, '-');
            const existingGallery = existingGalleries.find(g => g.id === galleryId);

            if (existingGallery) {
                // Merge: keep existing metadata and photos, add new photos
                const existingPhotoSrcs = new Set(existingGallery.photos.map(p => p.src));
                const newPhotos = files
                    .filter(file => !existingPhotoSrcs.has(`${PHOTO_DIR}/${item.name}/${file}`))
                    .map((file) => ({
                        src: `${PHOTO_DIR}/${item.name}/${file}`,
                        caption: '',
                        desc: ''
                    }));

                if (newPhotos.length > 0) {
                    existingGallery.photos.push(...newPhotos);
                    console.log(`+ Added ${newPhotos.length} new photos to "${item.name}"`);
                } else {
                    console.log(`✓ "${item.name}" - no new photos`);
                }

                // Update cover if first photo changed
                existingGallery.coverImage = `${PHOTO_DIR}/${item.name}/${files[0]}`;
                galleries.push(existingGallery);
            } else {
                // New gallery
                const gallery = {
                    id: galleryId,
                    name: '',  // 手动填写中文名
                    date: '',
                    location: '',
                    coverImage: `${PHOTO_DIR}/${item.name}/${files[0]}`,
                    description: '',
                    photos: files.map((file) => ({
                        src: `${PHOTO_DIR}/${item.name}/${file}`,
                        caption: '',
                        desc: ''
                    }))
                };
                galleries.push(gallery);
                console.log(`+ New gallery (folder: ${item.name}) with ${files.length} photos - fill in name manually`);
            }
        }
    }

    return galleries;
}

function generateJS(galleries) {
    const json = JSON.stringify(galleries, null, 4);
    return `
// Auto-generated at ${new Date().toISOString()}
// Run 'node scripts/scan-photos.js' to regenerate

const galleries = ${json};
`;
}

const galleries = scanDirectory(PHOTO_DIR);
const jsContent = generateJS(galleries);

fs.writeFileSync(OUTPUT_FILE, jsContent);
console.log(`\nTotal: ${galleries.length} galleries, ${galleries.reduce((sum, g) => sum + g.photos.length, 0)} photos`);
