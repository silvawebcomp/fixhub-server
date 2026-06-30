$ErrorActionPreference = "Stop"

$rawUrl = Read-Host "Paste the Neon PostgreSQL URL"
$databaseUrl = $rawUrl.Trim().Trim('"').Trim("'")

if ($databaseUrl -notmatch "^postgres(ql)?://") {
    throw "Invalid URL. It must start with postgresql:// or postgres://"
}

$directUrl = $databaseUrl -replace "-pooler(?=\.)", ""

$uri = [Uri]$directUrl
Write-Host "Running migrations against host: $($uri.Host)"
Write-Host "Database: $($uri.AbsolutePath.TrimStart('/'))"

$env:DATABASE_URL = $directUrl

try {
    npx.cmd prisma migrate deploy
} finally {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
}
