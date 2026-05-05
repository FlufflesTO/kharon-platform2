import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const requiredFiles = [
  process.env.PARITY_EVIDENCE_PRODUCTION || 'docs/evidence/production-env-parity.json',
  process.env.SMOKE_EVIDENCE_PRODUCTION || 'docs/evidence/production-smoke.json'
];

function isTruthy(value) {
  return String(value || '').toLowerCase() === 'true';
}

async function readJson(path) {
  const content = await readFile(resolve(process.cwd(), path), 'utf8');
  return JSON.parse(content);
}

async function main() {
  if (!isTruthy(process.env.REQUIRE_RELEASE_EVIDENCE)) {
    console.log('Release evidence check skipped (REQUIRE_RELEASE_EVIDENCE not true).');
    return;
  }

  for (const file of requiredFiles) {
    const payload = await readJson(file);
    if (file.includes('parity')) {
      if (!payload || payload.ready !== true) {
        throw new Error(`Parity evidence is not ready=true in ${file}`);
      }
    }
  }

  console.log('Release evidence check passed.');
}

main().catch((err) => {
  console.error('Release evidence check failed:', err);
  process.exit(1);
});
