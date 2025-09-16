@echo off
echo Cleaning mobile build artifacts...

echo Cleaning dist folder...
if exist "dist" rmdir /s /q "dist"

echo Cleaning Android build cache...
if exist "android\app\build" rmdir /s /q "android\app\build"
if exist "android\build" rmdir /s /q "android\build"
if exist "android\.gradle" rmdir /s /q "android\.gradle"

echo Cleaning Node.js cache...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

echo Clean completed!
pause