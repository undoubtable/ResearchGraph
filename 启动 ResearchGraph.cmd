@echo off
chcp 65001 >nul
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo 未找到 Node.js / npm。请先安装 Node.js 22.13 或更高版本。
  pause
  exit /b 1
)

if not exist "node_modules\vinext\dist\cli.js" (
  echo 首次启动，正在安装依赖...
  call npm install
  if errorlevel 1 (
    echo 依赖安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)

start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000/library'"
echo ResearchGraph 正在启动：http://localhost:3000/library
echo 保持此窗口打开即可使用；关闭窗口会停止本地网站。
call npm run dev
