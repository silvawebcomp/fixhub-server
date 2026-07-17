$ErrorActionPreference = "Stop"

$rawUrl = Read-Host "Paste the full unmasked Neon PostgreSQL URL"
$databaseUrl = $rawUrl.Trim().Trim('"').Trim("'")

if ($databaseUrl -notmatch "^postgres(ql)?://") {
    throw "Invalid URL. It must start with postgresql:// or postgres://"
}

if ($databaseUrl -match "\*{3,}") {
    throw "The database URL contains a masked password. Paste the full unmasked Neon connection string, not a value containing asterisks."
}

$directUrl = $databaseUrl -replace "-pooler(?=\.)", ""

function Invoke-PrismaMigrate {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url,

        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $uri = [Uri]$Url
    Write-Host "Running migrations using $Label connection"
    Write-Host "Host: $($uri.Host)"
    Write-Host "Database: $($uri.AbsolutePath.TrimStart('/'))"

    $env:DATABASE_URL = $Url
    npx.cmd prisma migrate deploy

    if ($LASTEXITCODE -ne 0) {
        throw "Prisma migrate failed using $Label connection."
    }
}

try {
    try {
        Invoke-PrismaMigrate -Url $directUrl -Label "direct"
    } catch {
        if ($databaseUrl -eq $directUrl) {
            throw
        }

        Write-Warning "Direct Neon connection failed. Retrying with the original pooled URL..."
        Invoke-PrismaMigrate -Url $databaseUrl -Label "pooled"
    }
} finally {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
}
