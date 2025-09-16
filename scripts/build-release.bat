@echo off
REM Build signed release APK for Sport Tracker
REM This script builds the production-ready APK for Google Play Store

echo Building Sport Tracker Release APK...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found. Please run this from the project root.
    pause
    exit /b 1
)

REM Check if Android platform exists
if not exist "android" (
    echo ERROR: Android platform not found. Please run 'npm run cap:add:android' first.
    pause
    exit /b 1
)

REM Check if keystore exists
if not exist "android\app\sport-tracker-release.keystore" (
    echo WARNING: Release keystore not found at android\app\sport-tracker-release.keystore
    echo Please run scripts\generate-keystore.bat first to create a signing keystore.
    set /p CONTINUE="Continue with debug build? (y/N): "
    if /i not "%CONTINUE%"=="y" (
        echo Build cancelled.
        pause
        exit /b 0
    )
)

echo Step 1: Cleaning previous builds...
call npm run clean:android
if %errorlevel% neq 0 (
    echo ERROR: Failed to clean Android build directory.
    pause
    exit /b 1
)

echo.
echo Step 2: Building optimized PWA...
call npm run build:production
if %errorlevel% neq 0 (
    echo ERROR: Failed to build PWA.
    pause
    exit /b 1
)

echo.
echo Step 3: Syncing to Capacitor...
call npm run cap:sync:android
if %errorlevel% neq 0 (
    echo ERROR: Failed to sync to Capacitor.
    pause
    exit /b 1
)

echo.
echo Step 4: Building signed Android APK...
cd android
call gradlew assembleRelease
set BUILD_RESULT=%errorlevel%
cd ..

if %BUILD_RESULT% neq 0 (
    echo ERROR: Failed to build release APK.
    echo Check the error messages above for details.
    pause
    exit /b 1
)

echo.
echo ✅ Release APK built successfully!
echo.

REM Find the generated APK
set APK_PATH=android\app\build\outputs\apk\release\app-release.apk
if exist "%APK_PATH%" (
    echo 📱 APK Location: %APK_PATH%
    
    REM Get APK size
    for %%A in ("%APK_PATH%") do set APK_SIZE=%%~zA
    set /a APK_SIZE_MB=%APK_SIZE% / 1024 / 1024
    echo 📊 APK Size: %APK_SIZE_MB% MB
    
    echo.
    echo Next steps:
    echo 1. Test the APK on various devices
    echo 2. Upload to Google Play Console for internal testing
    echo 3. Submit for review once testing is complete
    echo.
    
    set /p INSTALL="Install APK on connected device? (y/N): "
    if /i "%INSTALL%"=="y" (
        echo Installing APK...
        adb install -r "%APK_PATH%"
        if %errorlevel% equ 0 (
            echo ✅ APK installed successfully!
        ) else (
            echo ❌ Failed to install APK. Make sure device is connected and USB debugging is enabled.
        )
    )
) else (
    echo WARNING: APK not found at expected location: %APK_PATH%
    echo Check android\app\build\outputs\apk\ directory for the generated APK.
)

echo.
pause