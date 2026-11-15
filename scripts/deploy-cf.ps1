# Deploys the meka-studio Worker: sets secrets, then runs the OpenNext build + deploy.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\deploy-cf.ps1
$ErrorActionPreference = "Stop"
$env:CLOUDFLARE_API_TOKEN = Get-Content .cloudflare-token -Raw
$env:CLOUDFLARE_ACCOUNT_ID = "97777503afb12f1b023e3d1f711a2428"

$secrets = [ordered]@{
  "DATABASE_URL"               = (Select-String -Path .env -Pattern '^DATABASE_URL=').Line -replace '^DATABASE_URL=',''
  "SUPABASE_SERVICE_ROLE_KEY"  = (Select-String -Path .env -Pattern '^SUPABASE_SERVICE_ROLE_KEY=').Line -replace '^SUPABASE_SERVICE_ROLE_KEY=',''
  "SETUP_TOKEN"                = (Select-String -Path .env -Pattern '^SETUP_TOKEN=').Line -replace '^SETUP_TOKEN=',''
}
foreach ($name in $secrets.Keys) {
  Write-Output "secret put $name"
  $secrets[$name] | npx wrangler secret put $name 2>&1 | Select-Object -Last 2
}

Write-Output "deploy"
npx opennextjs-cloudflare build 2>&1 | Select-Object -Last 15
npx opennextjs-cloudflare deploy 2>&1 | Select-Object -Last 15
