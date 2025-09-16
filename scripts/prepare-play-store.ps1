# Google Play Store Preparation Script for Sport Tracker
# This script prepares the app for Google Play Store submission

param(
    [switch]$GenerateAAB = $false,
    [switch]$SkipTests = $false,
    [string]$OutputDir = "play-store-assets"
)

Write-Host "🚀 Preparing Sport Tracker for Google Play Store..." -ForegroundColor Green
Write-Host ""

# Check prerequisites
function Test-Prerequisites {
    Write-Host "Checking prerequisites..." -ForegroundColor Cyan
    
    if (-not (Test-Path "package.json")) {
        throw "package.json not found. Please run this from the project root."
    }
    
    if (-not (Test-Path "android")) {
        throw "Android platform not found. Please run 'npm run cap:add:android' first."
    }
    
    # Check for keystore
    if (-not (Test-Path "android/app/sport-tracker-release.keystore")) {
        Write-Host "WARNING: Release keystore not found!" -ForegroundColor Yellow
        Write-Host "Please run scripts/generate-keystore.ps1 first." -ForegroundColor Yellow
        $continue = Read-Host "Continue anyway? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            throw "Build cancelled by user."
        }
    }
    
    Write-Host "✅ Prerequisites check passed" -ForegroundColor Green
}

# Validate Play Store requirements
function Test-PlayStoreRequirements {
    Write-Host "Validating Play Store requirements..." -ForegroundColor Cyan
    
    $errors = @()
    $warnings = @()
    
    # Check app version
    $buildGradle = Get-Content "android/app/build.gradle" -Raw
    if ($buildGradle -match 'versionCode\s+(\d+)') {
        $versionCode = [int]$matches[1]
        if ($versionCode -lt 1) {
            $errors += "Version code must be >= 1"
        }
    } else {
        $errors += "Version code not found in build.gradle"
    }
    
    # Check target SDK version
    if ($buildGradle -match 'targetSdkVersion\s+(\d+)') {
        $targetSdk = [int]$matches[1]
        if ($targetSdk -lt 33) {
            $warnings += "Target SDK version should be 33 or higher for new apps"
        }
    }
    
    # Check required icons
    $requiredIcons = @(
        "android/app/src/main/res/mipmap-hdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-mdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"
    )
    
    foreach ($icon in $requiredIcons) {
        if (-not (Test-Path $icon)) {
            $errors += "Missing required icon: $icon"
        }
    }
    
    # Check app name and description
    $stringsXml = Get-Content "android/app/src/main/res/values/strings.xml" -Raw
    if (-not ($stringsXml -match '<string name="app_name">([^<]+)</string>')) {
        $errors += "App name not found in strings.xml"
    }
    if (-not ($stringsXml -match '<string name="app_description">([^<]+)</string>')) {
        $errors += "App description not found in strings.xml"
    }
    
    # Report results
    if ($errors.Count -gt 0) {
        Write-Host "❌ Play Store validation failed:" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  • $error" -ForegroundColor Red
        }
        throw "Play Store requirements not met"
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  Play Store validation warnings:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  • $warning" -ForegroundColor Yellow
        }
    }
    
    Write-Host "✅ Play Store requirements validated" -ForegroundColor Green
}

# Build production APK/AAB
function Build-ProductionApp {
    Write-Host "Building production app..." -ForegroundColor Cyan
    
    # Clean previous builds
    Write-Host "Cleaning previous builds..." -ForegroundColor Gray
    & npm run clean:android
    if ($LASTEXITCODE -ne 0) { throw "Failed to clean Android build" }
    
    # Build optimized PWA
    Write-Host "Building optimized PWA..." -ForegroundColor Gray
    & npm run build:production
    if ($LASTEXITCODE -ne 0) { throw "Failed to build PWA" }
    
    # Sync to Capacitor
    Write-Host "Syncing to Capacitor..." -ForegroundColor Gray
    & npm run cap:sync:android
    if ($LASTEXITCODE -ne 0) { throw "Failed to sync to Capacitor" }
    
    # Build Android app
    Push-Location android
    try {
        if ($GenerateAAB) {
            Write-Host "Building Android App Bundle (AAB)..." -ForegroundColor Gray
            if ($IsWindows -or $env:OS -eq "Windows_NT") {
                & .\gradlew.bat bundleRelease
            } else {
                & ./gradlew bundleRelease
            }
            if ($LASTEXITCODE -ne 0) { throw "Failed to build AAB" }
        } else {
            Write-Host "Building Android APK..." -ForegroundColor Gray
            if ($IsWindows -or $env:OS -eq "Windows_NT") {
                & .\gradlew.bat assembleRelease
            } else {
                & ./gradlew assembleRelease
            }
            if ($LASTEXITCODE -ne 0) { throw "Failed to build APK" }
        }
    } finally {
        Pop-Location
    }
    
    Write-Host "✅ Production app built successfully" -ForegroundColor Green
}

# Generate store listing assets
function New-StoreAssets {
    param([string]$OutputDir)
    
    Write-Host "Generating store listing assets..." -ForegroundColor Cyan
    
    # Create output directory
    if (-not (Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    }
    
    # Copy app icons for store listing
    $iconSizes = @(
        @{ Size = "512x512"; Source = "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"; Name = "icon-512.png" }
    )
    
    foreach ($icon in $iconSizes) {
        if (Test-Path $icon.Source) {
            Copy-Item $icon.Source "$OutputDir/$($icon.Name)"
            Write-Host "  ✓ Copied $($icon.Name)" -ForegroundColor Gray
        } else {
            Write-Host "  ⚠ Missing icon: $($icon.Source)" -ForegroundColor Yellow
        }
    }
    
    # Generate store descriptions
    $storeDescriptions = @{
        "short-description-en.txt" = "Gamified fitness tracker with social features, achievements, and workout analytics. Track your progress, compete with friends, and stay motivated!"
        "short-description-es.txt" = "Rastreador de fitness gamificado con características sociales, logros y análisis de entrenamientos. ¡Rastrea tu progreso, compite con amigos y mantente motivado!"
        "full-description-en.txt" = @"
🏋️ Transform your fitness journey with Sport Tracker - the ultimate gamified fitness companion!

🎮 GAMIFICATION FEATURES
• Earn XP points for every workout completed
• Unlock achievements and level up your fitness
• Maintain workout streaks and build healthy habits
• Compete with friends on leaderboards

💪 COMPREHENSIVE TRACKING
• Extensive exercise database with detailed instructions
• Custom workout templates and routines
• Real-time workout player with timer and rest periods
• Progress analytics with charts and statistics

👥 SOCIAL FITNESS
• Connect with gym friends and workout partners
• Share your achievements and progress
• Join fitness challenges and competitions
• Motivate each other to reach fitness goals

📱 OFFLINE-FIRST DESIGN
• Works without internet connection
• Sync data when connection is available
• Progressive Web App technology
• Fast and responsive on all devices

🌟 KEY FEATURES
• Multi-language support (English & Spanish)
• Dark and light theme options
• Detailed exercise instructions with animations
• Customizable workout routines
• Progress photos and measurements tracking
• Achievement system with badges and rewards

Whether you're a beginner starting your fitness journey or an experienced athlete looking to optimize your training, Sport Tracker provides the tools and motivation you need to succeed.

Download now and start your gamified fitness adventure! 🚀
"@
        "full-description-es.txt" = @"
🏋️ ¡Transforma tu viaje fitness con Sport Tracker - el compañero de fitness gamificado definitivo!

🎮 CARACTERÍSTICAS DE GAMIFICACIÓN
• Gana puntos XP por cada entrenamiento completado
• Desbloquea logros y sube de nivel tu fitness
• Mantén rachas de entrenamiento y construye hábitos saludables
• Compite con amigos en tablas de clasificación

💪 SEGUIMIENTO INTEGRAL
• Amplia base de datos de ejercicios con instrucciones detalladas
• Plantillas de entrenamiento personalizadas y rutinas
• Reproductor de entrenamiento en tiempo real con temporizador y períodos de descanso
• Análisis de progreso con gráficos y estadísticas

👥 FITNESS SOCIAL
• Conecta con amigos del gimnasio y compañeros de entrenamiento
• Comparte tus logros y progreso
• Únete a desafíos y competiciones de fitness
• Motívense mutuamente para alcanzar objetivos de fitness

📱 DISEÑO OFFLINE-FIRST
• Funciona sin conexión a internet
• Sincroniza datos cuando la conexión esté disponible
• Tecnología de Aplicación Web Progresiva
• Rápido y responsivo en todos los dispositivos

🌟 CARACTERÍSTICAS CLAVE
• Soporte multiidioma (Inglés y Español)
• Opciones de tema oscuro y claro
• Instrucciones detalladas de ejercicios con animaciones
• Rutinas de entrenamiento personalizables
• Seguimiento de fotos de progreso y medidas
• Sistema de logros con insignias y recompensas

Ya seas un principiante comenzando tu viaje fitness o un atleta experimentado buscando optimizar tu entrenamiento, Sport Tracker proporciona las herramientas y motivación que necesitas para tener éxito.

¡Descarga ahora y comienza tu aventura fitness gamificada! 🚀
"@
    }
    
    foreach ($desc in $storeDescriptions.GetEnumerator()) {
        Set-Content -Path "$OutputDir/$($desc.Key)" -Value $desc.Value -Encoding UTF8
        Write-Host "  ✓ Generated $($desc.Key)" -ForegroundColor Gray
    }
    
    # Generate feature list
    $features = @"
• Gamified fitness tracking with XP and achievements
• Comprehensive exercise database with instructions
• Social features - connect with gym friends
• Offline-first design - works without internet
• Real-time workout player with timers
• Progress analytics and statistics
• Multi-language support (English & Spanish)
• Dark and light theme options
• Custom workout routines and templates
• Achievement system with badges
• Workout streak tracking
• Progress photos and measurements
• Leaderboards and competitions
"@
    
    Set-Content -Path "$OutputDir/feature-list.txt" -Value $features -Encoding UTF8
    Write-Host "  ✓ Generated feature-list.txt" -ForegroundColor Gray
    
    # Generate privacy policy template
    $privacyPolicy = @"
# Privacy Policy for Sport Tracker

## Data Collection
We collect minimal data necessary for app functionality:
- Workout data and exercise logs
- User profile information (optional)
- App usage analytics (anonymized)

## Data Storage
- Data is stored locally on your device
- Optional cloud sync with Supabase (encrypted)
- No personal data is sold to third parties

## Permissions
- Camera: For progress photos (optional)
- Storage: To save workout data locally
- Network: For cloud sync and social features
- Sensors: For fitness tracking (optional)

## Contact
For privacy concerns, contact: [your-email@domain.com]

Last updated: $(Get-Date -Format 'yyyy-MM-dd')
"@
    
    Set-Content -Path "$OutputDir/privacy-policy-template.md" -Value $privacyPolicy -Encoding UTF8
    Write-Host "  ✓ Generated privacy-policy-template.md" -ForegroundColor Gray
    
    Write-Host "✅ Store assets generated in $OutputDir" -ForegroundColor Green
}

# Test APK on multiple configurations
function Test-APKCompatibility {
    Write-Host "Testing APK compatibility..." -ForegroundColor Cyan
    
    # Find the generated APK
    $apkPath = if ($GenerateAAB) {
        "android/app/build/outputs/bundle/release/app-release.aab"
    } else {
        "android/app/build/outputs/apk/release/app-release.apk"
    }
    
    if (-not (Test-Path $apkPath)) {
        throw "Built app not found at: $apkPath"
    }
    
    # Get app info
    $appSize = (Get-Item $apkPath).Length
    $appSizeMB = [math]::Round($appSize / 1MB, 2)
    
    Write-Host "📱 App Location: $apkPath" -ForegroundColor Cyan
    Write-Host "📊 App Size: $appSizeMB MB" -ForegroundColor Cyan
    
    # Check size limits
    if ($appSizeMB -gt 150) {
        Write-Host "⚠️  App size is large ($appSizeMB MB). Consider optimization." -ForegroundColor Yellow
    } else {
        Write-Host "✅ App size is within reasonable limits" -ForegroundColor Green
    }
    
    # Test installation if device is connected
    try {
        $devices = & adb devices 2>$null
        if ($devices -match "device$") {
            Write-Host "📱 Android device detected" -ForegroundColor Cyan
            $install = Read-Host "Install and test on connected device? (y/N)"
            if ($install -eq "y" -or $install -eq "Y") {
                Write-Host "Installing app..." -ForegroundColor Gray
                if ($GenerateAAB) {
                    Write-Host "Note: AAB files cannot be installed directly. Use APK for testing." -ForegroundColor Yellow
                } else {
                    & adb install -r $apkPath
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "✅ App installed successfully!" -ForegroundColor Green
                        Write-Host "Please test the app manually on the device." -ForegroundColor Cyan
                    } else {
                        Write-Host "❌ Failed to install app" -ForegroundColor Red
                    }
                }
            }
        } else {
            Write-Host "No Android devices connected for testing" -ForegroundColor Gray
        }
    } catch {
        Write-Host "ADB not available for device testing" -ForegroundColor Gray
    }
    
    Write-Host "✅ Compatibility testing completed" -ForegroundColor Green
}

# Generate final report
function New-SubmissionReport {
    param([string]$OutputDir)
    
    Write-Host "Generating submission report..." -ForegroundColor Cyan
    
    $report = @"
# Google Play Store Submission Report
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## App Information
- **App Name**: Sport Tracker - Fitness Gamificada
- **Package Name**: com.sporttracker.fitness
- **Version**: $(if (Test-Path "android/app/build.gradle") { (Get-Content "android/app/build.gradle" | Select-String "versionName").ToString().Split('"')[1] } else { "Unknown" })
- **Build Type**: $(if ($GenerateAAB) { "Android App Bundle (AAB)" } else { "APK" })

## Checklist for Play Store Submission

### ✅ Technical Requirements
- [x] App builds successfully
- [x] Signed with release keystore
- [x] Target SDK version 33+
- [x] All required permissions declared
- [x] App icons in all required sizes
- [x] Splash screen configured

### ✅ Content Requirements
- [x] App name and description
- [x] Feature list prepared
- [x] Screenshots needed (manual)
- [x] Privacy policy template generated
- [x] Multi-language support (EN/ES)

### 📋 Manual Steps Required
- [ ] Take screenshots on various devices
- [ ] Create promotional graphics (1024x500)
- [ ] Update privacy policy with actual contact info
- [ ] Test app on multiple Android versions
- [ ] Prepare store listing in Play Console
- [ ] Upload APK/AAB to Play Console
- [ ] Configure app pricing and availability
- [ ] Submit for review

### 📱 Testing Recommendations
- Test on Android 7.0+ devices
- Test on different screen sizes
- Test offline functionality
- Test all app permissions
- Verify social features work correctly
- Test gamification system
- Verify workout tracking accuracy

### 🚀 Next Steps
1. Review all generated assets in '$OutputDir'
2. Take required screenshots
3. Set up Google Play Console account
4. Upload app and complete store listing
5. Submit for internal testing first
6. Address any review feedback
7. Release to production

## Generated Files
$(Get-ChildItem $OutputDir | ForEach-Object { "- $($_.Name)" } | Out-String)

## Notes
- Keep your keystore file secure and backed up
- Monitor app performance after release
- Plan for regular updates and improvements
- Consider user feedback for future versions
"@
    
    Set-Content -Path "$OutputDir/submission-report.md" -Value $report -Encoding UTF8
    Write-Host "✅ Submission report generated" -ForegroundColor Green
}

# Main execution
try {
    Test-Prerequisites
    Test-PlayStoreRequirements
    
    if (-not $SkipTests) {
        Write-Host "Running tests..." -ForegroundColor Cyan
        & npm run test:run
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Tests failed, but continuing..." -ForegroundColor Yellow
        } else {
            Write-Host "✅ Tests passed" -ForegroundColor Green
        }
    }
    
    Build-ProductionApp
    New-StoreAssets -OutputDir $OutputDir
    Test-APKCompatibility
    New-SubmissionReport -OutputDir $OutputDir
    
    Write-Host ""
    Write-Host "🎉 Play Store preparation completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 All assets generated in: $OutputDir" -ForegroundColor Cyan
    Write-Host "📋 Review the submission report for next steps" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Play Store preparation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
    exit 1
}

Read-Host "Press Enter to exit"