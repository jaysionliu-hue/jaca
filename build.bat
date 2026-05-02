@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================
echo   墨境·高概念网文AI创作引擎 - 一键打包
echo ============================================
echo.

:: 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python，请先安装 Python 3.9+
    pause
    exit /b 1
)

:: 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo [1/4] 安装 Python 依赖...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [错误] Python 依赖安装失败
    pause
    exit /b 1
)
echo       完成

echo.
echo [2/4] 打包 Python 后端...
if not exist "dist\backend" mkdir dist\backend
pyinstaller --onefile --name backend --distpath dist\backend --workpath build\pyi-output backend\main.py --noconfirm
if errorlevel 1 (
    echo [错误] Python 后端打包失败
    pause
    exit /b 1
)
echo       完成

echo.
echo [3/4] 安装 Electron 依赖...
cd electron
if not exist "node_modules" (
    call npm install
)
if errorlevel 1 (
    echo [错误] Electron 依赖安装失败
    cd ..
    pause
    exit /b 1
)
echo       完成

echo.
echo [4/4] 打包 Electron 应用...
call npm run dist
if errorlevel 1 (
    echo [错误] Electron 打包失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo       完成

echo.
echo ============================================
echo   打包完成！
echo ============================================
echo.
echo 输出目录: dist\
echo.
echo Windows 安装包: dist\release\
echo.
echo 下一步:
echo   1. 找到生成的 .exe 文件
echo   2. 运行安装程序或直接执行便携版
echo   3. 享受墨境带来的创作乐趣！
echo.
pause
