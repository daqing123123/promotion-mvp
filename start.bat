@echo off
echo ========================================
echo 巨浪
echo ========================================
echo.

echo [1/4] 安装前端依赖...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo 前端依赖安装失败！
    pause
    exit /b 1
)
echo 前端依赖安装完成！
echo.

echo [2/4] 安装后端依赖...
cd ../backend
call npm install
if %errorlevel% neq 0 (
    echo 后端依赖安装失败！
    pause
    exit /b 1
)
echo 后端依赖安装完成！
echo.

echo [3/4] 启动后端服务器...
start "后端服务器" cmd /k "cd backend && npm run dev"
echo 后端服务器已启动！
echo.

echo [4/4] 启动前端服务器...
start "前端服务器" cmd /k "cd frontend && npm run dev"
echo 前端服务器已启动！
echo.

echo ========================================
echo 启动完成！
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3001
echo ========================================
echo.
pause
