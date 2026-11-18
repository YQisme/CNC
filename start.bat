@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   CNC 模拟器  — 一键启动
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先安装 Node 18+：
  echo   https://nodejs.org/
  echo.
  pause
  exit /b 1
)

where yarn >nul 2>&1
if errorlevel 1 (
  echo [错误] 未检测到 Yarn，请先安装：
  echo   npm install -g yarn
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [信息] Node.js %NODE_VER%

if not exist "node_modules\" (
  echo [信息] 首次运行，正在安装依赖...
  call yarn install
  if errorlevel 1 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
  )
  echo.
)

echo [信息] 约 5 秒后自动打开浏览器：http://localhost:3000
echo [信息] 按 Ctrl+C 可停止服务
echo.

start "" cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:3000"
call yarn dev

pause
