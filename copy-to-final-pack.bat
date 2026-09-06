@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo    COPY CKEDITOR 5 BUILD TO FINAL-PACK
echo ======================================================

set "ROOT_DIR=%~dp0"
set "SRC_DIST=%ROOT_DIR%ckeditor5-custom-build\dist"
set "DEST_DIST=%ROOT_DIR%final-pack\dist"
set "SRC_VUE=%ROOT_DIR%vue2-webpack4-demo\src\components\UrEditor.vue"
set "DEST_VUE=%ROOT_DIR%final-pack\UrEditor.vue"

:: 1. Kiem tra thu muc dist nguon
if not exist "%SRC_DIST%" (
    echo [ERROR] Thu muc "%SRC_DIST%" khong ton tai!
    echo Vui long chay "npm run build" trong ckeditor5-custom-build truoc.
    goto :end
)

:: 2. Tao thu muc dich neu chua co
if not exist "%DEST_DIST%" (
    mkdir "%DEST_DIST%"
    echo [+] Da tao thu muc: %DEST_DIST%
)

:: 3. Copy cac file build dist sang final-pack\dist
echo.
echo [1/2] Dang sao chep cac file build sang final-pack\dist...
robocopy "%SRC_DIST%" "%DEST_DIST%" /E /IS /IT /NP /NJH /NJS

if %ERRORLEVEL% LEQ 7 (
    echo [OK] Sao chep dist thanh cong!
) else (
    echo [ERROR] Co loi khi sao chep dist!
)

:: 4. Dong bo UrEditor.vue sang final-pack (doi import path sang ./dist/ckeditor.js)
echo.
echo [2/2] Dang dong bo UrEditor.vue sang final-pack...
if not exist "%SRC_VUE%" goto :skip_vue

powershell -NoProfile -Command "$content = [System.IO.File]::ReadAllText('%SRC_VUE%', [System.Text.Encoding]::UTF8); $content = $content -replace '../../../ckeditor5-custom-build/dist/ckeditor.js', './dist/ckeditor.js'; [System.IO.File]::WriteAllText('%DEST_VUE%', $content, (New-Object System.Text.UTF8Encoding $false))"
echo [OK] Da dong bo UrEditor.vue thanh cong!
goto :done_vue

:skip_vue
echo [INFO] Bo qua UrEditor.vue (khong tim thay file nguon).

:done_vue

echo.
echo ======================================================
echo    HOAN THANH! Ban final-pack da duoc cap nhat.
echo ======================================================
echo.

:end
if "%1"=="" pause
