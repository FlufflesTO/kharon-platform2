import {
  readFileSync,
  writeFileSync,
  existsSync,
  copyFileSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'fs';
import { join } from 'path';

// ── 1. Find all wrangler.json files under dist/server/ recursively ────────────
// The adapter may generate configs in nested directories (e.g. .prerender/).
// Scanning recursively means new adapter-generated paths are caught automatically
// without needing to update the hardcoded list on each adapter upgrade.
function findWranglerConfigs(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const item of readdirSync(dir)) {
    const p = join(dir, item);
    if (statSync(p).isDirectory()) {
      results.push(...findWranglerConfigs(p));
    } else if (item === 'wrangler.json') {
      results.push(p);
    }
  }
  return results;
}

const STRIP_KEYS = ['assets', 'pages_build_output_dir'];

const wranglerConfigs = findWranglerConfigs('dist/server');

if (wranglerConfigs.length === 0) {
  console.error('ERROR: No wrangler.json found under dist/server/ — was "astro build" run?');
  process.exit(1);
}

for (const p of wranglerConfigs) {
  const config = JSON.parse(readFileSync(p, 'utf8'));
  const stripped = STRIP_KEYS.filter((k) => k in config);
  if (stripped.length === 0) continue;
  for (const k of stripped) delete config[k];
  writeFileSync(p, JSON.stringify(config, null, 2));
  console.log(`Patched ${p}: removed ${stripped.join(', ')}`);
}

// ── 2. Resolve entry point from adapter's wrangler.json ───────────────────────
// The adapter declares the Worker entry via the "main" field in its generated
// wrangler.json. Reading it here means the _worker.js wrapper stays correct
// even if the adapter renames its output file (e.g. entry.mjs → index.mjs).
const rootServerConfig = 'dist/server/wrangler.json';
if (!existsSync(rootServerConfig)) {
  console.error('ERROR: dist/server/wrangler.json not found after patching — adapter output may have changed structure.');
  process.exit(1);
}

const serverConfig = JSON.parse(readFileSync(rootServerConfig, 'utf8'));
const entryFile = serverConfig.main;

if (!entryFile) {
  console.error('ERROR: dist/server/wrangler.json has no "main" field — adapter output format may have changed. Check the adapter release notes.');
  process.exit(1);
}

const entryPath = join('dist/server', entryFile);
if (!existsSync(entryPath)) {
  console.error(`ERROR: Entry point "${entryPath}" does not exist — the adapter may have renamed its output. Inspect dist/server/ and update accordingly.`);
  process.exit(1);
}

console.log(`Entry point resolved: ${entryFile}`);

// ── 3. Copy server Worker into the Pages deploy directory ─────────────────────
// Cloudflare Pages uses _worker.js in the deploy directory as the SSR Worker.
// We copy dist/server/ → dist/client/_server/ so all Worker chunks stay together.
function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const item of readdirSync(src)) {
    const srcPath = join(src, item);
    const destPath = join(dest, item);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

copyDir('dist/server', 'dist/client/_server');
console.log('Copied dist/server → dist/client/_server');

// ── 4. Create _worker.js entry using the resolved entry file name ──────────────
writeFileSync(
  'dist/client/_worker.js',
  `import worker from './_server/${entryFile}';\nexport default worker;\n`
);
console.log(`Created dist/client/_worker.js (imports _server/${entryFile})`);

// ── 5. Exclude _server from static asset serving ──────────────────────────────
// Pages would otherwise attempt to serve the server chunks as static files.
const assetsIgnorePath = 'dist/client/.assetsignore';
const existing = existsSync(assetsIgnorePath)
  ? readFileSync(assetsIgnorePath, 'utf8')
  : '';

const lines = existing.split('\n').map((l) => l.trim());
if (!lines.includes('_server')) {
  writeFileSync(assetsIgnorePath, lines.filter(Boolean).concat('_server').join('\n') + '\n');
  console.log('Updated .assetsignore: excluded _server');
}
