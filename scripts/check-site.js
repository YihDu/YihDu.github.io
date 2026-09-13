const fs = require('node:fs');
const path = require('node:path');

const directory = path.resolve(process.argv[2] || '_site');
if (!fs.existsSync(path.join(directory, 'index.html'))) {
  console.error('Build the site first, then run npm run check:site -- <build-directory>.');
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const target = path.join(dir, item.name);
    return item.isDirectory() ? walk(target) : [target];
  });
}

function attributes(tag) {
  return Object.fromEntries(Array.from(tag.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/gs),
    ([, key, , value]) => [key, value.replace(/&amp;/g, '&').replace(/&quot;/g, '"')]));
}

const htmlFiles = walk(directory).filter((file) => file.endsWith('.html'));
const errors = [];
let references = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(directory, file);
  const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${relative}: duplicate id`);
  if (html.includes('Album not found')) errors.push(`${relative}: orphaned album`);
  const base = new URL('/' + relative.replace(/index\.html$/, ''), 'https://local.invalid');
  if (html.includes('class="site-main"')) {
    const canonical = Array.from(html.matchAll(/<link\b[^>]*>/g), ([tag]) => attributes(tag))
      .find((attrs) => attrs.rel === 'canonical');
    if (!canonical || decodeURIComponent(new URL(canonical.href).pathname) !== decodeURIComponent(base.pathname)) {
      errors.push(`${relative}: canonical does not point to this page`);
    }
  }

  function checkReference(value) {
    if (!value || /^(https?:|mailto:|data:|tel:|\/\/)/i.test(value)) return;
    const url = new URL(value, base);
    const pathname = decodeURIComponent(url.pathname);
    let target = path.join(directory, pathname);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    references += 1;
    if (!fs.existsSync(target)) errors.push(`${relative}: missing ${value}`);
    if (url.hash && target === file && !ids.includes(decodeURIComponent(url.hash.slice(1)))) {
      errors.push(`${relative}: missing anchor ${url.hash}`);
    }
  }

  for (const [tag] of html.matchAll(/<(?:a|img|script|link)\b[^>]*>/g)) {
    const attrs = attributes(tag);
    checkReference(attrs.href || attrs.src);
    if (attrs.srcset) {
      for (const candidate of attrs.srcset.split(',')) {
        const parts = candidate.trim().split(/\s+/);
        if (parts.length !== 2 || !/^\d+w$/.test(parts[1])) errors.push(`${relative}: invalid srcset ${candidate}`);
        else checkReference(parts[0]);
      }
    }
  }
}

for (const omitted of ['scripts', 'tests', 'node_modules', 'package.json']) {
  if (fs.existsSync(path.join(directory, omitted))) errors.push(`Build includes development files: ${omitted}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Checked ${htmlFiles.length} HTML pages and ${references} local references; no missing files, anchors, or duplicate IDs.`);
