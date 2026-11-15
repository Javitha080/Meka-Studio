$ErrorActionPreference = "Continue"
npm run typecheck
if ($LASTEXITCODE -ne 0) { Write-Output "### TYPECHECK FAILED ###"; exit 1 }

# Build-time DB override: prerendering queries Supabase through the transaction
# pooler (6543), which is intermittently congested; the session pooler (5432)
# serves the same database. Only `next build` sees this override — restored
# right after so nothing downstream (deploy secrets) is affected.
$envLines = Get-Content .env
$mig = ($envLines | Where-Object { $_ -match '^DATABASE_URL_MIGRATIONS=' }) -replace '^DATABASE_URL_MIGRATIONS=', ''
$mig = ($mig | Select-Object -First 1).Trim()
$prevUrl = $env:DATABASE_URL
$env:DATABASE_URL = $mig
Write-Output "### build DATABASE_URL overridden to session pooler (5432) ###"
npx next build --webpack
$env:DATABASE_URL = $prevUrl
if ($LASTEXITCODE -ne 0) { Write-Output "### NEXT BUILD FAILED ###"; exit 1 }
npx opennextjs-cloudflare build --skipNextBuild
if ($LASTEXITCODE -ne 0) { Write-Output "### OPENNEXT BUILD FAILED ###"; exit 1 }
$env:OPEN_NEXT_DEPLOY = "true"
npx wrangler deploy --dry-run --outdir=.wrangler-dry
if ($LASTEXITCODE -ne 0) { Write-Output "### DRY-RUN FAILED ###"; exit 1 }
Write-Output "### ALL BUILD STEPS OK ###"
