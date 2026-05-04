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

// ── 1. Remove wrangler configs that cause Pages validation errors ─────────────
// The adapter copies pages_build_output_dir from the root wrangler.toml into
// the server wrangler.json. Having both "main" and "pages_build_output_dir" in
// the same file makes wrangler treat it as a Pages config and reject Worker-only
// keys. The ASSETS binding is also reserved by Pages and cannot be declared.
const wranglerTargets = [
  'dist/server/wrangler.json',
  'dist/server/.prerender/wrangler.json',
];

const STRIP_KEYS = ['assets', 'pages_build_output_dir'];

for (const p of wranglerTargets) {
  if (!existsSync(p)) continue;
  const config = JSON.parse(readFileSync(p, 'utf8'));
  const stripped = STRIP_KEYS.filter((k) => k in config);
  if (stripped.length === 0) continue;
  for (const k of stripped) delete config[k];
  writeFileSync(p, JSON.stringify(config, null, 2));
  console.log(`Patched ${p}: removed ${stripped.join(', ')}`);
}

// ── 2. Copy server Worker into the Pages deploy directory ────────────────────
// Cloudflare Pages uses _worker.js in the deploy directory as the SSR Worker.
// The adapter outputs the Worker entry to dist/server/entry.mjs (not dist/client).
// We copy dist/server/ → dist/client/_server/ so the Worker and its chunk
// imports stay together, then create a thin _worker.js wrapper.
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

// ── 3. Create _worker.js entry for Pages advanced mode ───────────────────────
writeFileSync(
  'dist/client/_worker.js',
  `import worker from './_server/entry.mjs';\nexport default worker;\n`
);
console.log('Created dist/client/_worker.js');

// ── 4. Exclude _server from static asset serving ─────────────────────────────
// Pages would otherwise try to serve the server chunks as static files.
const assetsIgnorePath = 'dist/client/.assetsignore';
const existing = existsSync(assetsIgnorePath)
  ? readFileSync(assetsIgnorePath, 'utf8')
  : '';

if (!existing.includes('_server')) {
  writeFileSync(assetsIgnorePath, existing.trimEnd() + '\n_server\n');
  console.log('Updated .assetsignore: excluded _server');
}
