# ============================================
# Sync Claude MAX credentials to Unraid
# ============================================
# Esegui questo script sul tuo PC Windows per copiare
# le credenziali Claude MAX al server Unraid.
#
# Uso: .\sync-credentials.ps1 -UnraidHost "tower" -UnraidShare "appdata"
#

param(
    [string]$UnraidHost = "tower",
    [string]$UnraidShare = "appdata",
    [string]$LocalClaudePath = "$env:USERPROFILE\.claude"
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "  Claude MAX Credentials Sync to Unraid"
Write-Host "=========================================="
Write-Host ""

# Check local credentials exist
if (-not (Test-Path $LocalClaudePath)) {
    Write-Host "ERRORE: Directory Claude non trovata: $LocalClaudePath" -ForegroundColor Red
    Write-Host "Esegui prima 'claude login' sul tuo PC" -ForegroundColor Yellow
    exit 1
}

$credFile = Join-Path $LocalClaudePath "credentials.json"
if (-not (Test-Path $credFile)) {
    Write-Host "ERRORE: credentials.json non trovato" -ForegroundColor Red
    Write-Host "Esegui 'claude login' per autenticarti" -ForegroundColor Yellow
    exit 1
}

Write-Host "Credenziali locali trovate: $LocalClaudePath" -ForegroundColor Green

# Build UNC path
$uncPath = "\\$UnraidHost\$UnraidShare\claude-code\config"

Write-Host "Destinazione: $uncPath"
Write-Host ""

# Check Unraid is accessible
if (-not (Test-Path "\\$UnraidHost\$UnraidShare")) {
    Write-Host "ERRORE: Impossibile raggiungere \\$UnraidHost\$UnraidShare" -ForegroundColor Red
    Write-Host "Verifica:" -ForegroundColor Yellow
    Write-Host "  1. Unraid è acceso e raggiungibile" -ForegroundColor Yellow
    Write-Host "  2. La share '$UnraidShare' è accessibile" -ForegroundColor Yellow
    Write-Host "  3. Hai le credenziali per accedere a Unraid" -ForegroundColor Yellow
    exit 1
}

# Create destination directory if needed
if (-not (Test-Path $uncPath)) {
    Write-Host "Creazione directory: $uncPath"
    New-Item -ItemType Directory -Path $uncPath -Force | Out-Null
}

# Copy credentials
Write-Host "Copia credenziali..."
Copy-Item -Path "$LocalClaudePath\*" -Destination $uncPath -Recurse -Force

Write-Host ""
Write-Host "=========================================="
Write-Host "  SYNC COMPLETATO" -ForegroundColor Green
Write-Host "=========================================="
Write-Host ""
Write-Host "File copiati in: $uncPath"
Write-Host ""
Write-Host "Prossimi passi:"
Write-Host "  1. Su Unraid: docker restart claude-code"
Write-Host "  2. Testa: docker exec -it claude-code cc --version"
Write-Host ""
