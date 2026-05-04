param(
  [Parameter(Mandatory=$true)][string]$BaseUrl,
  [Parameter(Mandatory=$true)][string]$InternalToken
)

$ErrorActionPreference = 'Stop'

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$loginResp = Invoke-WebRequest -Method Post -Uri "$BaseUrl/api/auth/login" -Body @{ token = $InternalToken } -WebSession $session -MaximumRedirection 0 -ErrorAction SilentlyContinue
if ($loginResp.StatusCode -ne 302 -and $loginResp.StatusCode -ne 200) {
  throw "Login failed with status $($loginResp.StatusCode)"
}

$parity = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/internal/env-parity" -WebSession $session
$metrics = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/internal/sla-metrics" -WebSession $session

Write-Host 'Env parity:'
$parity | ConvertTo-Json -Depth 6
Write-Host 'SLA metrics:'
$metrics | ConvertTo-Json -Depth 6

if (-not $parity.ready) {
  throw 'Parity check failed: missing required keys.'
}

Write-Host 'Parity check passed.'
