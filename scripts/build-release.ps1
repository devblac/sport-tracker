# Build Release APK/AAB Script for Sport Tracker
param(
    [string]$BuildType = "apk",
    [string]$Environment = "production",
    [switch]$Clean = $false,
    [switch]$Validate = $true
)

# Color output functions
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }

Write-Info "=== Sport Tracker Mobile Build Script ==="
Write-Info "Build Type: $BuildType"
Write-Info "Environment: $Environment"
Write-Info "Clean Build: $Clean"
Write-Info "Validate: $Validate"
Write-Info ""

# Check prerequisites
Write-Info "Checking prerequisites..."

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "✓ Node.js: $nodeVersion"
} catch {
    Write-Error "✗ Node.js not found. Please install Node.js 18+"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "✓ npm: $npmVersion"
} catch {
    Write-Error "✗ npm not found"
    exit 1
}

# Check Capacitor CLI
try {
    $capVersion = npx cap --version
    Write-Success "✓ Capacitor CLI: $capVersion"
} catch {
    Write-Error "✗ Capacitor CLI not found. Installing..."
    npm install -g @capacitor/cli
}

# Check Android SDK
if (-not $env:ANDROID_HOME) {
    Write-Warning "⚠ ANDROID_HOME not set. Please ensure Android SDK is installed."
}

# Check Java
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Success "✓ Java: $javaVersion"
} catch {
    Write-Error "✗ Java not found. Please install JDK 17+"
    exit 1
}

Write-Info ""

# Clean previous builds if requested
if ($Clean) {
    Write-Info "Cleaning previous builds..."
    
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Success "✓ Cleaned dist directory"
    }
    
    if (Test-Path "android/app/build") {
        Remove-Item -Recurse -Force "android/app/build"
        Write-Success "✓ Cleaned Android build directory"
    }
    
    if (Test-Path "node_modules/.vite") {
        Remove-Item -Recurse -Force "node_modules/.vite"
        Write-Success "✓ Cleaned Vite cache"
    }
    
    Write-Info ""
}

# Install dependencies
Write-Info "Installing dependencies..."
try {
    npm ci
    Write-Success "✓ Dependencies installed"
} catch {
    Write-Error "✗ Failed to install dependencies"
    exit 1
}

Write-Info ""

# Build PWA
Write-Info "Building PWA for $Environment..."
try {
    if ($Environment -eq "production") {
        npm run build:production
    } else {
        npm run build
    }
    Write-Success "✓ PWA build completed"
} catch {
    Write-Error "✗ PWA build failed"
    exit 1
}

Write-Info ""

# Sync with Capacitor
Write-Info "Syncing with Capacitor..."
try {
    npx cap sync android
    Write-Success "✓ Capacitor sync completed"
} catch {
    Write-Error "✗ Capacitor sync failed"
    exit 1
}

Write-Info ""

# Build Android
Write-Info "Building Android $BuildType..."
try {
    Set-Location "android"
    
    if ($BuildType -eq "bundle") {
        ./gradlew bundleRelease
        $outputPath = "app/build/outputs/bundle/release/app-release.aab"
        $outputType = "AAB"
    } else {
        ./gradlew assembleRelease
        $outputPath = "app/build/outputs/apk/release/app-release.apk"
        $outputType = "APK"
    }
    
    Set-Location ".."
    Write-Success "✓ Android $outputType build completed"
} catch {
    Set-Location ".."
    Write-Error "✗ Android build failed"
    exit 1
}

Write-Info ""

# Validate build if requested
if ($Validate) {
    Write-Info "Validating build..."
    
    $fullOutputPath = "android/$outputPath"
    if (Test-Path $fullOutputPath) {
        $fileSize = (Get-Item $fullOutputPath).Length / 1MB
        Write-Success "✓ Build file exists: $fullOutputPath"
        Write-Info "  File size: $([math]::Round($fileSize, 2)) MB"
        
        # Check if file size is reasonable (not too small or too large)
        if ($fileSize -lt 5) {
            Write-Warning "⚠ Build file seems unusually small ($([math]::Round($fileSize, 2)) MB)"
        } elseif ($fileSize -gt 100) {
            Write-Warning "⚠ Build file seems unusually large ($([math]::Round($fileSize, 2)) MB)"
        }
        
        # Run validation script if it exists
        if (Test-Path "scripts/validate-build.js") {
            try {
                node scripts/validate-build.js
                Write-Success "✓ Build validation passed"
            } catch {
                Write-Warning "⚠ Build validation script failed"
            }
        }
    } else {
        Write-Error "✗ Build file not found: $fullOutputPath"
        exit 1
    }
}

Write-Info ""

# Summary
Write-Success "=== Build Completed Successfully ==="
Write-Info "Build Type: $BuildType ($outputType)"
Write-Info "Environment: $Environment"
Write-Info "Output: android/$outputPath"

if ($BuildType -eq "bundle") {
    Write-Info ""
    Write-Info "Next steps for Play Store submission:"
    Write-Info "1. Go to Google Play Console"
    Write-Info "2. Navigate to Release > Production"
    Write-Info "3. Upload the AAB file: android/$outputPath"
    Write-Info "4. Add release notes and configure rollout"
    Write-Info "5. Review and publish"
} else {
    Write-Info ""
    Write-Info "APK ready for testing:"
    Write-Info "1. Install on device: adb install android/$outputPath"
    Write-Info "2. Test all functionality thoroughly"
    Write-Info "3. For Play Store, consider building AAB instead"
}

Write-Info ""
Write-Success "Build script completed at $(Get-Date)"