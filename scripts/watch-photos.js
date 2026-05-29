const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PHOTO_DIR = path.join('assets', 'img', 'photography');
const SCAN_SCRIPT = path.join('scripts', 'scan-photos.js');
const POLL_MS = 1000;

let lastSnapshot = '';
let running = false;
let pending = false;

function snapshotDir(dir) {
  const rows = [];

  function walk(currentDir) {
    fs.readdirSync(currentDir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((item) => {
        const fullPath = path.join(currentDir, item.name);
        const stat = fs.statSync(fullPath);
        rows.push(`${fullPath}:${stat.mtimeMs}:${stat.size}`);
        if (item.isDirectory()) {
          walk(fullPath);
        }
      });
  }

  walk(dir);
  return rows.join('\n');
}

function runScan(reason) {
  if (running) {
    pending = true;
    return;
  }

  running = true;
  const label = reason ? ` (${reason})` : '';
  console.log(`\n[photos] Regenerating${label}...`);

  const child = spawn(process.execPath, [SCAN_SCRIPT], {
    stdio: 'inherit'
  });

  child.on('exit', (code) => {
    running = false;
    if (code !== 0) {
      console.error(`[photos] scan failed with exit code ${code}`);
    }
    lastSnapshot = snapshotDir(PHOTO_DIR);
    if (pending) {
      pending = false;
      runScan('pending changes');
    }
  });
}

function checkForChanges() {
  const nextSnapshot = snapshotDir(PHOTO_DIR);
  if (nextSnapshot !== lastSnapshot) {
    lastSnapshot = nextSnapshot;
    runScan('photo metadata changed');
  }
}

if (!fs.existsSync(PHOTO_DIR)) {
  console.error(`[photos] Missing directory: ${PHOTO_DIR}`);
  process.exit(1);
}

lastSnapshot = snapshotDir(PHOTO_DIR);
runScan('initial');
setInterval(checkForChanges, POLL_MS);
console.log(`[photos] Watching ${PHOTO_DIR}. Press Ctrl+C to stop.`);
