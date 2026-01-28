@echo off
REM Quick Docker Commands for Box-Games
REM Run this from the project root directory

echo.
echo =========================================
echo    Box-Games Docker Command Helper
echo =========================================
echo.

if "%1"=="" (
    echo Usage: docker-commands.bat [command]
    echo.
    echo Available commands:
    echo   build           - Build images (fresh)
    echo   build-nocache   - Build without cache
    echo   start           - Start containers
    echo   start-bg        - Start containers in background
    echo   stop            - Stop containers
    echo   logs            - View all logs
    echo   logs-frontend   - View frontend logs only
    echo   logs-backend    - View backend logs only
    echo   status          - Check container status
    echo   clean           - Stop and remove all
    echo   reset           - Clean build and start fresh
    echo   test            - Test connections
    echo.
    exit /b 0
)

if "%1"=="build" (
    echo Building Docker images...
    docker compose build
    exit /b 0
)

if "%1"=="build-nocache" (
    echo Building Docker images without cache...
    docker compose build --no-cache
    exit /b 0
)

if "%1"=="start" (
    echo Starting containers...
    docker compose up
    exit /b 0
)

if "%1"=="start-bg" (
    echo Starting containers in background...
    docker compose up -d
    echo.
    echo Containers are starting. Check status with: docker compose ps
    exit /b 0
)

if "%1"=="stop" (
    echo Stopping containers...
    docker compose stop
    exit /b 0
)

if "%1"=="logs" (
    echo Showing all logs (Ctrl+C to exit)...
    docker compose logs -f
    exit /b 0
)

if "%1"=="logs-frontend" (
    echo Showing frontend logs (Ctrl+C to exit)...
    docker compose logs -f frontend
    exit /b 0
)

if "%1"=="logs-backend" (
    echo Showing backend logs (Ctrl+C to exit)...
    docker compose logs -f backend
    exit /b 0
)

if "%1"=="status" (
    echo Checking container status...
    docker compose ps
    exit /b 0
)

if "%1"=="clean" (
    echo Stopping and removing containers...
    docker compose down
    exit /b 0
)

if "%1"=="reset" (
    echo Performing full reset...
    echo 1. Removing containers...
    docker compose down
    echo 2. Pruning system...
    docker system prune -f
    echo 3. Building fresh...
    docker compose build --no-cache
    echo 4. Starting services...
    docker compose up
    exit /b 0
)

if "%1"=="test" (
    echo Testing connections...
    echo.
    echo Testing Frontend (localhost:3000)...
    timeout /t 1 /nobreak > nul
    curl -s -o /dev/null -w "Status: %%{http_code}\n" http://localhost:3000
    echo.
    echo Testing Backend (localhost:8000)...
    curl -s -o /dev/null -w "Status: %%{http_code}\n" http://localhost:8000
    echo.
    echo Testing Health Endpoint...
    curl -s -o /dev/null -w "Status: %%{http_code}\n" http://localhost:8000/health
    exit /b 0
)

echo Unknown command: %1
echo Run without arguments for help
exit /b 1
