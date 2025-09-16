@echo off
REM Generate Android keystore for app signing
REM This script creates a keystore file for signing the Android APK

echo Generating Android keystore for Sport Tracker app...
echo.

REM Check if keytool is available
keytool -help >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: keytool not found. Please ensure Java JDK is installed and in PATH.
    echo You can download it from: https://adoptium.net/
    pause
    exit /b 1
)

REM Create android directory if it doesn't exist
if not exist "android" (
    echo ERROR: android directory not found. Please run this from the project root.
    pause
    exit /b 1
)

REM Set keystore path
set KEYSTORE_PATH=android\app\sport-tracker-release.keystore

REM Check if keystore already exists
if exist "%KEYSTORE_PATH%" (
    echo WARNING: Keystore already exists at %KEYSTORE_PATH%
    set /p OVERWRITE="Do you want to overwrite it? (y/N): "
    if /i not "%OVERWRITE%"=="y" (
        echo Keystore generation cancelled.
        pause
        exit /b 0
    )
    del "%KEYSTORE_PATH%"
)

echo.
echo Please provide the following information for your keystore:
echo (Keep this information secure - you'll need it for app updates)
echo.

set /p ALIAS="Key alias (e.g., sport-tracker-key): "
if "%ALIAS%"=="" set ALIAS=sport-tracker-key

set /p VALIDITY="Validity in years (default 25): "
if "%VALIDITY%"=="" set VALIDITY=25

set /p KEYSIZE="Key size (default 2048): "
if "%KEYSIZE%"=="" set KEYSIZE=2048

echo.
echo Generating keystore with the following settings:
echo - Path: %KEYSTORE_PATH%
echo - Alias: %ALIAS%
echo - Validity: %VALIDITY% years
echo - Key size: %KEYSIZE% bits
echo.

REM Generate the keystore
keytool -genkeypair -v ^
    -keystore "%KEYSTORE_PATH%" ^
    -alias "%ALIAS%" ^
    -keyalg RSA ^
    -keysize %KEYSIZE% ^
    -validity %VALIDITY%000 ^
    -storepass android ^
    -keypass android ^
    -dname "CN=Sport Tracker, OU=Fitness App, O=Sport Tracker, L=City, ST=State, C=US"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Keystore generated successfully!
    echo.
    echo IMPORTANT: Keep the following information secure:
    echo - Keystore file: %KEYSTORE_PATH%
    echo - Alias: %ALIAS%
    echo - Store password: android
    echo - Key password: android
    echo.
    echo You'll need this information for:
    echo - Signing release APKs
    echo - Publishing app updates to Google Play Store
    echo.
    echo Next steps:
    echo 1. Update android/app/build.gradle with signing configuration
    echo 2. Run: npm run android:build:release
    echo.
) else (
    echo.
    echo ❌ Failed to generate keystore. Please check the error messages above.
)

pause