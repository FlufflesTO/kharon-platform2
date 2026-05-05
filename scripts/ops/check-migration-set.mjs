import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';

const requiredFiles = [
  'src/data/d1-schema.sql',
  'src/data/d1-sla-fields.sql',
  'src/data/d1-ticket-events.sql',
  'src/data/d1-auth-attempts.sql',
  'src/data/d1-export-audit-log.sql'
];

async function ensureExists(path) {
  await access(resolve(process.cwd(), path), constants.F_OK);
}

async function main() {
  const missing = [];
  for (const file of requiredFiles) {
    try {
      await ensureExists(file);
    } catch {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    console.error('Missing required migration files:');
    for (const file of missing) console.error(`- ${file}`);
    process.exit(1);
  }

  console.log('Migration policy check passed.');
}

main().catch((err) => {
  console.error('Migration policy check failed:', err);
  process.exit(1);
});
