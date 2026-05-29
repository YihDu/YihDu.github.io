const fs = require('fs');
const path = require('path');

const PHOTO_DIR = path.join('assets', 'img', 'photography');
const META_FILE = path.join(PHOTO_DIR, 'albums.json');
const OUTPUT_FILE = path.join('_data', 'photography.yml');
const ALBUM_PAGE_DIR = 'photos';
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp)$/i;

function readMetadata() {
  if (!fs.existsSync(META_FILE)) return {};
  return JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
}

function yamlString(value) {
  return JSON.stringify(String(value || ''));
}

function titleFromFolder(folder) {
  return folder
    .replace(/^\d+-/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function photoPath(...segments) {
  return path.posix.join('/assets/img/photography', ...segments);
}

function readImageFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter((file) => IMAGE_EXTENSIONS.test(file))
    .sort();
}

function scanChapter(albumFolder, chapterMeta, fallbackOrder) {
  const chapterFolder = chapterMeta.folder || chapterMeta.title || '';
  const chapterPath = path.join(PHOTO_DIR, albumFolder, chapterFolder);
  const files = readImageFiles(chapterPath);
  const coverFile = files.length
    ? (chapterMeta.cover && files.includes(chapterMeta.cover) ? chapterMeta.cover : files[0])
    : '';

  return {
    folder: chapterFolder,
    title: chapterMeta.title || titleFromFolder(chapterFolder),
    order: Number(chapterMeta.order || fallbackOrder || 0),
    date: chapterMeta.date || '',
    note: chapterMeta.note || '',
    description: chapterMeta.description || '',
    cover: coverFile ? photoPath(albumFolder, chapterFolder, coverFile) : '',
    photos: files.map((file) => ({
      src: photoPath(albumFolder, chapterFolder, file),
      alt: `${chapterMeta.title || titleFromFolder(chapterFolder)} - ${file}`,
      caption: (chapterMeta.captions && chapterMeta.captions[file]) || ''
    }))
  };
}

function scanAlbums() {
  const metadata = readMetadata();
  const folders = fs.readdirSync(PHOTO_DIR, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name);
  const usedFolders = new Set(
    Object.values(metadata)
      .map((meta) => meta.folder)
      .filter(Boolean)
  );
  const ids = new Set([
    ...Object.keys(metadata),
    ...folders.filter((folder) => !usedFolders.has(folder))
  ]);

  return [...ids].map((folder) => {
    const meta = metadata[folder] || {};
    const folderName = meta.folder || folder;
    const folderPath = path.join(PHOTO_DIR, folderName);
    const files = readImageFiles(folderPath);
    const chapterMetaList = Array.isArray(meta.chapters) ? meta.chapters : [];
    const chapterFolders = new Set([
      ...chapterMetaList.map((chapter) => chapter.folder).filter(Boolean),
      ...(
        fs.existsSync(folderPath)
          ? fs.readdirSync(folderPath, { withFileTypes: true })
            .filter((item) => item.isDirectory())
            .map((item) => item.name)
          : []
      )
    ]);
    const hasChapters = chapterMetaList.length > 0 || chapterFolders.size > 0;
    const chapters = hasChapters
      ? [...chapterFolders].map((chapterFolder, index) => {
        const chapterMeta = chapterMetaList.find((chapter) => chapter.folder === chapterFolder) || {};
        return scanChapter(folderName, chapterMeta, index + 1);
    }).sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return b.folder.localeCompare(a.folder);
      })
      : [];

    const rootCover = files.length
      ? (meta.cover && files.includes(meta.cover) ? meta.cover : files[0])
      : '';
    const chapterCover = chapters.find((chapter) => chapter.cover)?.cover || '';
    const cover = rootCover
      ? photoPath(folderName, rootCover)
      : chapterCover;
    const rootPhotos = files.map((file) => ({
      src: photoPath(folderName, file),
      alt: `${meta.title || titleFromFolder(folderName)} - ${file}`,
      caption: (meta.captions && meta.captions[file]) || ''
    }));
    const chapterPhotos = chapters.flatMap((chapter) => chapter.photos);

    return {
      id: folder,
      title: meta.title || titleFromFolder(folder),
      date: meta.date || '',
      order: Number(meta.order || normalizeDateOrder(meta.date) || 0),
      group: meta.group || 'Travel',
      location: meta.location || '',
      description: meta.description || '',
      note: meta.note || '',
      cover,
      photos: hasChapters ? [...rootPhotos, ...chapterPhotos] : rootPhotos,
      chapters: hasChapters ? chapters : []
    };
  }).sort((a, b) => {
    if (b.order !== a.order) return b.order - a.order;
    return b.id.localeCompare(a.id);
  });
}

function normalizeDateOrder(date) {
  if (!date) return 0;
  const digits = String(date).replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits.padEnd(6, '0').slice(0, 6));
}

function toYaml(albums) {
  const lines = [
    '# Auto-generated by scripts/scan-photos.js.',
    '# Edit assets/img/photography/albums.json for album metadata.',
    ''
  ];

  albums.forEach((album) => {
    lines.push(`- id: ${yamlString(album.id)}`);
    lines.push(`  title: ${yamlString(album.title)}`);
    lines.push(`  date: ${yamlString(album.date)}`);
    lines.push(`  order: ${album.order}`);
    lines.push(`  group: ${yamlString(album.group)}`);
    lines.push(`  location: ${yamlString(album.location)}`);
    lines.push(`  description: ${yamlString(album.description)}`);
    lines.push(`  note: ${yamlString(album.note)}`);
    lines.push(`  cover: ${yamlString(album.cover)}`);
    lines.push('  photos:');
    album.photos.forEach((photo) => {
      lines.push(`    - src: ${yamlString(photo.src)}`);
      lines.push(`      alt: ${yamlString(photo.alt)}`);
      lines.push(`      caption: ${yamlString(photo.caption)}`);
    });
    if (album.chapters && album.chapters.length > 0) {
      lines.push('  chapters:');
      album.chapters.forEach((chapter) => {
        lines.push('    - folder: ' + yamlString(chapter.folder));
        lines.push(`      title: ${yamlString(chapter.title)}`);
        lines.push(`      order: ${chapter.order}`);
        lines.push(`      date: ${yamlString(chapter.date)}`);
        lines.push(`      note: ${yamlString(chapter.note)}`);
        lines.push(`      description: ${yamlString(chapter.description)}`);
        lines.push(`      cover: ${yamlString(chapter.cover)}`);
        lines.push('      photos:');
        chapter.photos.forEach((photo) => {
          lines.push(`        - src: ${yamlString(photo.src)}`);
          lines.push(`          alt: ${yamlString(photo.alt)}`);
          lines.push(`          caption: ${yamlString(photo.caption)}`);
        });
      });
    }
  });

  return `${lines.join('\n')}\n`;
}

function albumPage(album) {
  return `---
layout: photo-album
title: ${yamlString(album.title)}
nav: photos
album_id: ${yamlString(album.id)}
hide_footnote: true
permalink: /photos/${album.id}/
---
`;
}

function writeAlbumPages(albums) {
  if (!fs.existsSync(ALBUM_PAGE_DIR)) {
    fs.mkdirSync(ALBUM_PAGE_DIR);
  }

  albums.forEach((album) => {
    fs.writeFileSync(path.join(ALBUM_PAGE_DIR, `${album.id}.md`), albumPage(album));
  });
}

const albums = scanAlbums();
fs.writeFileSync(OUTPUT_FILE, toYaml(albums));
writeAlbumPages(albums);
console.log(`Generated ${OUTPUT_FILE} and ${albums.length} album pages: ${albums.reduce((sum, album) => sum + album.photos.length, 0)} photos.`);
