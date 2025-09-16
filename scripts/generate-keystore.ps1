# Generate Android keystore for app signing
# This script creates a keystore file for signing the Android APK

Write-Host "Generating Android keystore for Sport Tracker app..." -ForegroundColor Green
Write-Host ""

# Check if keytool is available
try {
    $null = Get-Command keytool -ErrorAction Stop
} catch {
    Write-Host "ERROR: keytool not found. Please ensure Java JDK is installed and in PATH." -ForegroundColor Red
    Write-Host "You can download it from: https://adoptium.net/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Create android directory if it doesn't exist
if (-not (Test-Path "android")) {
    Write-Host "ERROR: android directory not found. Please run this from the project root." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Set keystore path
$keystorePath = "android/app/sport-tracker-release.keystore"

# Check if keystore already exists
if (Test-Path $keystorePath) {
    Write-Host "WARNING: Keystore already exists at $keystorePath" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Keystore generation cancelled." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 0
    }
    Remove-Item $keystorePath -Force
}

Write-Host ""
Write-Host "Please provide the following information for your keystore:" -ForegroundColor Cyan
Write-Host "(Keep this information secure - you'll need it for app updates)" -ForegroundColor Yellow
Write-Host ""

$alias = Read-Host "Key alias (default: sport-tracker-key)"
if ([string]::IsNullOrEmpty($alias)) { $alias = "sport-tracker-key" }

$validity = Read-Host "Validity in years (default: 25)"
if ([string]::IsNullOrEmpty($validity)) { $validity = "25" }

$keysize = Read-Host "Key size (default: 2048)"
if ([string]::IsNullOrEmpty($keysize)) { $keysize = "2048" }

Write-Host ""
Write-Host "Generating keystore with the following settings:" -ForegroundColor Cyan
Write-Host "- Path: $keystorePath"
Write-Host "- Alias: $alias"
Write-Host "- Validity: $validity years"
Write-Host "- Key size: $keysize bits"
Write-Host ""

# Calculate validity in days
$validityDays = [int]$validity * 365

# Generate the keystore
$keystoreArgs = @(
    "-genkeypair", "-v",
    "-keystore", $keystorePath,
    "-alias", $alias,
    "-keyalg", "RSA",
    "-keysize", $keysize,
    "-validity", $validityDays,
    "-storepass", "android",
    "-keypass", "android",
    "-dname", "CN=Sport Tracker, OU=Fitness App, O=Sport Tracker, L=City, ST=State, C=US"
)

try {
    & keytool @keystoreArgs
    
    Write-Host ""
    Write-Host "✅ Keystore generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Keep the following information secure:" -ForegroundColor Yellow
    Write-Host "- Keystore file: $keystorePath"
    Write-Host "- Alias: $alias"
    Write-Host "- Store password: android"
    Write-Host "- Key password: android"
    Write-Host ""
    Write-Host "You'll need this information for:" -ForegroundColor Cyan
    Write-Host "- Signing release APKs"
    Write-Host "- Publishing app updates to Google Play Store"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "1. Update android/app/build.gradle with signing configuration"
    Write-Host "2. Run: npm run android:build:release"
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "❌ Failed to generate keystore. Error: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "Press Enter to exit"