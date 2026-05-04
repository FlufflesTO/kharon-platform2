param(
  [string]$DatabaseName = 'kharon'
)

$ErrorActionPreference = 'Stop'

if (-not $env:CLOUDFLARE_API_TOKEN) {
  throw 'CLOUDFLARE_API_TOKEN is not set.'
}

$files = @(
  'src/data/d1-schema.sql',
  'src/data/d1-sla-fields.sql',
  'src/data/d1-ticket-events.sql',
  'src/data/d1-auth-attempts.sql',
  'src/data/d1-export-audit-log.sql'
)

foreach ($file in $files) {
  Write-Host "Applying $file to $DatabaseName (remote)..."
  npx wrangler d1 execute $DatabaseName --remote --file $file
}

Write-Host 'Remote migrations applied.'
