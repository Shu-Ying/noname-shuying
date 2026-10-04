@echo off
setlocal
cd /d "%~dp0.."
set /p "SHUYING_RELEASE_VERSION=Input version, for example 2.0.0.4: "
if not defined SHUYING_RELEASE_VERSION (
    echo Version cannot be empty.
    pause
    exit /b 1
)
python tools\prepare_release_manifest.py --root .
if errorlevel 1 (
    echo Release preparation failed. Commit all source changes first.
    pause
    exit /b 1
)
pause
