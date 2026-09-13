const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { albumYears } = require('../scripts/scan-photos');

class Element {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.listeners = {};
    this.attributes = {};
    this.children = {};
    this.hidden = false;
    this.classes = new Set();
    this.classList = {
      add: (name) => this.classes.add(name),
      remove: (name) => this.classes.delete(name),
      contains: (name) => this.classes.has(name),
      toggle: (name, active) => active ? this.classes.add(name) : this.classes.delete(name)
    };
  }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  emit(name, event = {}) { (this.listeners[name] || []).forEach((callback) => callback(event)); }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  querySelector(selector) { return this.children[selector] || null; }
  focus() { this.focused = true; }
  showModal() { this.open = true; }
  close() { this.open = false; this.emit('close'); }
}

function runTheme({ saved = null, dark = false, blocked = false, automatic = true } = {}) {
  const root = new Element({ autoTheme: String(automatic) });
  const button = new Element();
  button.children.i = new Element();
  const document = new Element();
  document.documentElement = root;
  document.children['.theme-toggle'] = button;
  const media = new Element();
  media.matches = dark;
  const window = new Element();
  window.matchMedia = () => media;
  const storage = {
    getItem() { if (blocked) throw Error('Storage unavailable'); return saved; },
    setItem(key, value) { if (blocked) throw Error('Storage unavailable'); saved = value; }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/theme-toggle.js'), 'utf8'), {
    document, window, localStorage: storage
  });
  document.emit('DOMContentLoaded');
  return { root, button, media, window };
}

test('a dark system can be overridden with an explicit light preference', () => {
  const { root, button } = runTheme({ dark: true });
  assert.equal(root.dataset.theme, 'dark');
  button.emit('click');
  assert.equal(root.dataset.theme, 'light');
  assert.equal(button.attributes['aria-label'], 'Switch to dark theme');
  assert.equal(runTheme({ dark: true, saved: 'light' }).root.dataset.theme, 'light');
});

test('theme changes survive unavailable storage and respect automatic-theme settings', () => {
  const { root, button, media } = runTheme({ blocked: true, dark: true });
  button.emit('click');
  assert.equal(root.dataset.theme, 'light');
  media.emit('change');
  assert.equal(root.dataset.theme, 'light');
  assert.equal(runTheme({ dark: true, automatic: false }).root.dataset.theme, 'light');
});

test('system changes apply only until the user makes a choice', () => {
  const { root, media, button } = runTheme();
  media.matches = true;
  media.emit('change');
  assert.equal(root.dataset.theme, 'dark');
  button.emit('click');
  media.emit('change');
  assert.equal(root.dataset.theme, 'light');
});

test('year ranges include every year and allow an explicit list', () => {
  assert.deepEqual(albumYears({ date: '2025-2026' }), ['2025', '2026']);
  assert.deepEqual(albumYears({ date: '2026.05' }), ['2026']);
  assert.deepEqual(albumYears({ years: [2026, 2024, 2026] }), ['2024', '2026']);
  assert.deepEqual(albumYears({ date: '' }), []);
});

test('album filters include years and recover from empty combinations', () => {
  const document = new Element(); document.documentElement = new Element(); const home = new Element();
  const empty = new Element(); const status = new Element(); const reset = new Element(); const resetPlace = new Element();
  const years = ['All', '2026', '2024'].map((yearFilter) => new Element({ yearFilter }));
  const cards = [new Element({ years: '2025 2026', place: 'conference' }), new Element({ years: '2024', place: 'travel' })];
  document.children = { '.photo-home': home, '.photo-filter-empty': empty, '[data-filter-status]': status,
    '[data-filter-reset]': reset, '[data-place-reset]': resetPlace };
  document.querySelectorAll = (selector) => ({ '[data-photo]': [], '[data-year-filter]': years, '.photo-story': cards,
    '[data-place-filter]': [] }[selector] || []);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/photo-archive.js'), 'utf8'), { document, history: { replaceState() {} },
    location: { search: '' }, URLSearchParams });
  years[1].emit('click', { preventDefault() {} }); assert.equal(cards[0].hidden, false); assert.equal(cards[1].hidden, true);
  years[2].emit('click', { preventDefault() {} }); assert.equal(empty.hidden, true); assert.equal(status.textContent, '1 story');
  reset.emit('click'); assert.ok(cards.every((card) => !card.hidden)); assert.equal(empty.hidden, true);
});

test('photograph viewer wraps navigation, closes cleanly, and preserves modified link clicks', () => {
  const document = new Element();
  const root = document.documentElement = new Element();
  const dialog = new Element();
  const image = new Element();
  const next = new Element();
  const previous = new Element();
  const counter = new Element();
  const close = new Element();
  const error = new Element();
  error.children.a = new Element();
  dialog.children = { img: image, '.photo-lightbox-caption': new Element(), '.photo-lightbox-counter': counter,
    '.photo-lightbox-error': error, '.photo-lightbox-prev': previous, '.photo-lightbox-next': next,
    '.photo-lightbox-close': close };
  const tiles = ['first.jpg', 'second.jpg'].map((href) => {
    const tile = new Element({ caption: href });
    tile.href = href;
    tile.children.img = { alt: href };
    return tile;
  });
  document.children['.photo-lightbox'] = dialog;
  document.querySelectorAll = () => tiles;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/photography.js'), 'utf8'), { document });
  tiles[0].emit('click', { preventDefault() {} });
  assert.equal(dialog.open, true);
  assert.equal(root.classes.has('has-open-dialog'), true);
  previous.emit('click');
  assert.equal(image.src, 'second.jpg');
  dialog.emit('keydown', { key: 'ArrowRight', preventDefault() {} });
  assert.equal(counter.textContent, '1 / 2');
  image.emit('error');
  assert.equal(error.hidden, false);
  next.emit('click');
  assert.equal(error.hidden, true);
  close.emit('click');
  assert.equal(root.classes.has('has-open-dialog'), false);
  tiles[0].emit('click', { metaKey: true, preventDefault() { assert.fail('Modified click intercepted'); } });
  assert.equal(dialog.open, false);
});

test('photo scanning discovers chapters, keeps GIF URLs, and redirects orphaned pages', { skip: process.platform !== 'darwin' }, (t) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'photo-scanner-test-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const imageDir = path.join(fixture, 'assets/img/photography');
  fs.mkdirSync(path.join(imageDir, 'conference/Unlisted Chapter'), { recursive: true });
  fs.mkdirSync(path.join(fixture, '_data'));
  fs.mkdirSync(path.join(fixture, 'photos'));
  const sourceImage = path.join(__dirname, '../assets/img/photography/generated/thumbs/02-2025-japan/A.jpg');
  fs.copyFileSync(sourceImage, path.join(imageDir, 'conference/Unlisted Chapter/A.JPG'));
  fs.writeFileSync(path.join(imageDir, 'conference/animation.gif'), Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  fs.writeFileSync(path.join(imageDir, 'albums.json'), JSON.stringify({ conference: { date: '2025-2026' } }));
  fs.writeFileSync(path.join(fixture, 'photos/old.md'), '---\nlayout: photo-album\nalbum_id: "old"\npermalink: /photos/old/\n---\n');
  fs.writeFileSync(path.join(fixture, 'photos/manual.md'), 'A manually maintained page.\n');
  const run = spawnSync(process.execPath, [path.join(__dirname, '../scripts/scan-photos.js')], { cwd: fixture, encoding: 'utf8', timeout: 60000 });
  assert.equal(run.status, 0, run.stderr);
  const output = fs.readFileSync(path.join(fixture, '_data/photography.yml'), 'utf8');
  assert.match(output, /years: \["2025","2026"\]/);
  assert.match(output, /chapter: "Unlisted Chapter"/);
  assert.match(output, /src: "\/assets\/img\/photography\/conference\/animation.gif"/);
  assert.match(output, /cover: "\/assets\/img\/photography\/generated\/large\/conference\/Unlisted Chapter\/A.jpg"/);
  assert.match(output, /width: \d+/);
  assert.match(fs.readFileSync(path.join(fixture, 'photos/old.md'), 'utf8'), /layout: photo-redirect/);
  assert.equal(fs.readFileSync(path.join(fixture, 'photos/manual.md'), 'utf8'), 'A manually maintained page.\n');
});
