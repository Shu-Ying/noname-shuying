@echo off
setlocal
cd /d "%~dp0.."
set /p VERSION=Input version, for example 2.0.0.4: 
if "%VERSION%"=="" (
    echo Version cannot be empty.
    pause
    exit /b 1
)
python tools\generate_manifest.py --root . --version "%VERSION%" --out dist\manifest.json
pause
