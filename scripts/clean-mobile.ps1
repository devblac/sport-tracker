# Mobile Build Cleanup Script for Windows PowerShell

Write-Host "Cleaning mobile build artifacts..." -ForegroundColor Green

# Clean dist folder
if (Test-Path "dist") {
    Write-Host "Cleaning dist folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist"
}

# Clean Android build cache
if (Test-Path "android/app/build") {
    Write-Host "Cleaning Android app build..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "android/app/build"
}

if (Test-Path "android/build") {
    Write-Host "Cleaning Android build..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "android/build"
}

if (Test-Path "android/.gradle") {
    Write-Host "Cleaning Android Gradle cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "android/.gradle"
}

# Clean Node.js cache
if (Test-Path "node_modules/.vite") {
    Write-Host "Cleaning Vite cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules/.vite"
}

if (Test-Path "node_modules/.cache") {
    Write-Host "Cleaning Node cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules/.cache"
}

Write-Host "Clean completed successfully!" -ForegroundColor Green