const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PHOTO_DIR = path.join('assets', 'img', 'photography');
const META_FILE = path.join(PHOTO_DIR, 'albums.json');
const OUTPUT_FILE = path.join('_data', 'photography.yml');
const ALBUM_PAGE_DIR = 'photos';
const GENERATED_DIR = 'generated';
const THUMB_DIR = path.join(PHOTO_DIR, GENERATED_DIR, 'thumbs');
const LARGE_DIR = path.join(PHOTO_DIR, GENERATED_DIR, 'large');
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp)$/i;
const GENERATED_EXTENSIONS = /\.(jpg|jpeg|png)$/i;
const IGNORED_ALBUM_DIRS = new Set([GENERATED_DIR, '_generated']);
const THUMB_MAX_SIZE = 960;
const LARGE_MAX_SIZE = 1800;
const DERIVATIVE_REBUILD_MIN_BYTES = 60000;
const optimizedSources = new Map();
const assetCache = new Map();

function imageSize(imagePath) {
  const result = spawnSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', imagePath], { encoding: 'utf8' });
  if (result.status !== 0) return {};
  const width = Number(result.stdout.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(result.stdout.match(/pixelHeight:\s*(\d+)/)?.[1]);
  return width && height ? { width, height } : {};
}

function albumYears(meta) {
  if (Array.isArray(meta.years)) return [...new Set(meta.years.map(String))].sort();
  const range = String(meta.date || '').match(/^(\d{4})\s*[-–—]\s*(\d{4})$/);
  if (range) {
    const start = Number(range[1]);
    const end = Number(range[2]);
    if (end >= start && end - start < 100) {
      return Array.from({ length: end - start + 1 }, (_, index) => String(start + index));
    }
  }
  const year = String(meta.date || '').match(/^\d{4}/);
  return year ? [year[0]] : [];
}

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

function generatedPath(kind, ...segments) {
  return path.posix.join('/assets/img/photography', GENERATED_DIR, kind, ...segments);
}

function readImageFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter((file) => IMAGE_EXTENSIONS.test(file))
    .sort();
}

function generatedFileSegments(...segments) {
  const filename = segments[segments.length - 1];
  const parsed = path.parse(filename);
  return [
    ...segments.slice(0, -1),
    `${parsed.name}.jpg`
  ];
}

function needsGeneratedFile(sourcePath, outputPath) {
  if (!fs.existsSync(outputPath)) return true;
  if (usesDisplayP3(sourcePath) && fs.statSync(outputPath).size < DERIVATIVE_REBUILD_MIN_BYTES) return true;
  return fs.statSync(sourcePath).mtimeMs > fs.statSync(outputPath).mtimeMs;
}

function usesDisplayP3(sourcePath) {
  const result = spawnSync('sips', ['-g', 'profile', sourcePath], { encoding: 'utf8' });
  return result.status === 0 && /profile:\s*Display P3/i.test(result.stdout);
}

function optimizedSourcePath(sourcePath) {
  if (!usesDisplayP3(sourcePath)) return sourcePath;
  if (optimizedSources.has(sourcePath)) return optimizedSources.get(sourcePath);

  const parsed = path.parse(sourcePath);
  const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'photo-source-'));
  const outputPath = path.join(tempDir, `${parsed.name}.jpg`);
  const result = spawnSync('sips', [
    '--optimizeColorForSharing',
    sourcePath,
    '--out', outputPath
  ], { encoding: 'utf8' });

  if (result.status !== 0) {
    throw new Error(`Failed to optimize ${sourcePath}: ${result.stderr || result.stdout}`);
  }

  optimizedSources.set(sourcePath, outputPath);
  return outputPath;
}

function generateDerivative(sourcePath, outputPath, maxSize) {
  if (!GENERATED_EXTENSIONS.test(sourcePath)) return;
  if (!needsGeneratedFile(sourcePath, outputPath)) return;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const inputPath = optimizedSourcePath(sourcePath);
  const result = spawnSync('sips', [
    '-s', 'format', 'jpeg',
    '--resampleHeightWidthMax', String(maxSize),
    inputPath,
    '--out', outputPath
  ], { encoding: 'utf8' });

  if (result.status !== 0) {
    throw new Error(`Failed to generate ${outputPath}: ${result.stderr || result.stdout}`);
  }
}

function photoAssets(albumFolder, file, chapterFolder) {
  const sourceSegments = chapterFolder
    ? [albumFolder, chapterFolder, file]
    : [albumFolder, file];
  const outputSegments = generatedFileSegments(...sourceSegments);
  const sourcePath = path.join(PHOTO_DIR, ...sourceSegments);
  if (assetCache.has(sourcePath)) return assetCache.get(sourcePath);
  if (!GENERATED_EXTENSIONS.test(file)) {
    const original = photoPath(...sourceSegments);
    const size = imageSize(sourcePath);
    const assets = { original, src: original, thumb: original, ...size, thumb_width: size.width };
    assetCache.set(sourcePath, assets);
    return assets;
  }
  const thumbPath = path.join(THUMB_DIR, ...outputSegments);
  const largePath = path.join(LARGE_DIR, ...outputSegments);

  generateDerivative(sourcePath, thumbPath, THUMB_MAX_SIZE);
  generateDerivative(sourcePath, largePath, LARGE_MAX_SIZE);

  const size = imageSize(largePath);
  const thumbSize = imageSize(thumbPath);
  const assets = {
    original: photoPath(...sourceSegments),
    src: generatedPath('large', ...outputSegments),
    thumb: generatedPath('thumbs', ...outputSegments),
    ...size,
    thumb_width: thumbSize.width
  };
  assetCache.set(sourcePath, assets);
  return assets;
}

function scanChapter(albumFolder, chapterMeta, fallbackOrder) {
  const chapterFolder = chapterMeta.folder || chapterMeta.title || '';
  const chapterPath = path.join(PHOTO_DIR, albumFolder, chapterFolder);
  const files = readImageFiles(chapterPath);
  const coverFile = files.length
    ? (files.find((file) => file.toLowerCase() === String(chapterMeta.cover || '').toLowerCase()) || files[0])
    : '';

  return {
    folder: chapterFolder,
    title: chapterMeta.title || titleFromFolder(chapterFolder),
    order: Number(chapterMeta.order || fallbackOrder || 0),
    date: chapterMeta.date || '',
    note: chapterMeta.note || '',
    description: chapterMeta.description || '',
    cover: coverFile ? photoAssets(albumFolder, coverFile, chapterFolder).src : '',
    coverThumb: coverFile ? photoAssets(albumFolder, coverFile, chapterFolder).thumb : '',
    photos: files.map((file) => ({
      ...photoAssets(albumFolder, file, chapterFolder),
      chapter: chapterFolder,
      alt: `${chapterMeta.title || titleFromFolder(chapterFolder)} - ${file}`,
      caption: (chapterMeta.captions && chapterMeta.captions[file]) || ''
    }))
  };
}

function scanAlbums() {
  const metadata = readMetadata();
  const folders = fs.readdirSync(PHOTO_DIR, { withFileTypes: true })
    .filter((item) => item.isDirectory() && !IGNORED_ALBUM_DIRS.has(item.name))
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
        const chapterMeta = chapterMetaList.find((chapter) => chapter.folder === chapterFolder) || { folder: chapterFolder };
        return scanChapter(folderName, chapterMeta, index + 1);
    }).sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return b.folder.localeCompare(a.folder);
      })
      : [];

    const rootCover = files.length
      ? (files.find((file) => file.toLowerCase() === String(meta.cover || '').toLowerCase()) || files[0])
      : '';
    const chapterCover = chapters.find((chapter) => chapter.cover)?.cover || '';
    const chapterCoverThumb = chapters.find((chapter) => chapter.coverThumb)?.coverThumb || '';
    const cover = rootCover
      ? photoAssets(folderName, rootCover).thumb
      : chapterCoverThumb;
    const coverLarge = rootCover
      ? photoAssets(folderName, rootCover).src
      : chapterCover;
    const rootPhotos = files.map((file) => ({
      ...photoAssets(folderName, file),
      chapter: '',
      alt: `${meta.title || titleFromFolder(folderName)} - ${file}`,
      caption: (meta.captions && meta.captions[file]) || ''
    }));
    const chapterPhotos = chapters.flatMap((chapter) => chapter.photos);
    const coverPhoto = [...rootPhotos, ...chapterPhotos].find((photo) => photo.src === coverLarge);

    return {
      id: folder,
      title: meta.title || titleFromFolder(folder),
      date: meta.date || '',
      years: albumYears(meta),
      order: Number(meta.order || normalizeDateOrder(meta.date) || 0),
      group: meta.group || 'Travel',
      location: meta.location || '',
      latitude: meta.latitude ?? '',
      longitude: meta.longitude ?? '',
      description: meta.description || '',
      note: meta.note || '',
      cover,
      coverLarge: rootCover ? coverLarge : chapterCover,
      coverThumb: rootCover ? cover : chapterCoverThumb,
      coverWidth: coverPhoto?.width,
      coverHeight: coverPhoto?.height,
      coverThumbWidth: coverPhoto?.thumb_width,
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
    lines.push(`  years: ${JSON.stringify(album.years)}`);
    lines.push(`  order: ${album.order}`);
    lines.push(`  group: ${yamlString(album.group)}`);
    lines.push(`  location: ${yamlString(album.location)}`);
    lines.push(`  latitude: ${yamlString(album.latitude)}`);
    lines.push(`  longitude: ${yamlString(album.longitude)}`);
    lines.push(`  description: ${yamlString(album.description)}`);
    lines.push(`  note: ${yamlString(album.note)}`);
    lines.push(`  cover: ${yamlString(album.cover)}`);
    lines.push(`  cover_large: ${yamlString(album.coverLarge)}`);
    lines.push(`  cover_thumb: ${yamlString(album.coverThumb)}`);
    if (album.coverWidth && album.coverHeight) {
      lines.push(`  cover_width: ${album.coverWidth}`);
      lines.push(`  cover_height: ${album.coverHeight}`);
      lines.push(`  cover_thumb_width: ${album.coverThumbWidth}`);
    }
    lines.push('  photos:');
    album.photos.forEach((photo) => {
      lines.push(`    - src: ${yamlString(photo.src)}`);
      lines.push(`      thumb: ${yamlString(photo.thumb)}`);
      lines.push(`      original: ${yamlString(photo.original)}`);
      lines.push(`      alt: ${yamlString(photo.alt)}`);
      lines.push(`      caption: ${yamlString(photo.caption)}`);
      lines.push(`      chapter: ${yamlString(photo.chapter)}`);
      if (photo.width && photo.height) {
        lines.push(`      width: ${photo.width}`);
        lines.push(`      height: ${photo.height}`);
        lines.push(`      thumb_width: ${photo.thumb_width}`);
      }
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
        lines.push(`      cover_thumb: ${yamlString(chapter.coverThumb)}`);
        lines.push('      photos:');
        chapter.photos.forEach((photo) => {
          lines.push(`        - src: ${yamlString(photo.src)}`);
          lines.push(`          thumb: ${yamlString(photo.thumb)}`);
          lines.push(`          original: ${yamlString(photo.original)}`);
          lines.push(`          alt: ${yamlString(photo.alt)}`);
          lines.push(`          caption: ${yamlString(photo.caption)}`);
          lines.push(`          chapter: ${yamlString(photo.chapter)}`);
          if (photo.width && photo.height) {
            lines.push(`          width: ${photo.width}`);
            lines.push(`          height: ${photo.height}`);
            lines.push(`          thumb_width: ${photo.thumb_width}`);
          }
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
description: ${yamlString(`${album.title} — photographs by Yihang Du. ${album.date} ${album.location}`.trim())}
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
  // Keep old URLs useful after renaming an album, without deleting user-authored pages.
  const activeIds = new Set(albums.map((album) => album.id));
  fs.readdirSync(ALBUM_PAGE_DIR).filter((file) => file.endsWith('.md')).forEach((file) => {
    const pagePath = path.join(ALBUM_PAGE_DIR, file);
    const source = fs.readFileSync(pagePath, 'utf8');
    const match = source.match(/^album_id: "([^"]+)"$/m);
    if (!match || activeIds.has(match[1]) || !/^layout: photo-album$/m.test(source)) return;
    fs.writeFileSync(pagePath, source.replace(/^layout: photo-album$/m, 'layout: photo-redirect'));
  });
}

if (require.main === module) {
  const albums = scanAlbums();
  fs.writeFileSync(OUTPUT_FILE, toYaml(albums));
  writeAlbumPages(albums);
  console.log(`Generated ${OUTPUT_FILE} and ${albums.length} album pages: ${albums.reduce((sum, album) => sum + album.photos.length, 0)} photos.`);
}

module.exports = { albumYears, photoAssets, scanAlbums, toYaml, writeAlbumPages };
