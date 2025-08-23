@echo off
REM Health check script for Supabase containerized services (Windows)
REM This script verifies that all Supabase services are running and accessible

setlocal enabledelayedexpansion

echo 🔍 Checking Supabase containerized services health...

REM Default ports (can be overridden by environment variables)
if not defined SUPABASE_API_PORT set SUPABASE_API_PORT=54321
if not defined SUPABASE_DB_PORT set SUPABASE_DB_PORT=54322
if not defined SUPABASE_STUDIO_PORT set SUPABASE_STUDIO_PORT=54323
if not defined SUPABASE_AUTH_PORT set SUPABASE_AUTH_PORT=9999

set failed_checks=0

REM Function to check if a service is responding
:check_service
set service_name=%1
set url=%2
echo Checking %service_name%...

curl -s -o nul -w "%%{http_code}" "%url%" | findstr /r "^200" >nul
if !errorlevel! equ 0 (
    echo ✓ %service_name% OK
) else (
    echo ✗ %service_name% FAILED
    set /a failed_checks+=1
)
goto :eof

REM Check database
echo Checking PostgreSQL database...
docker exec apex-overflow-supabase-db-1 pg_isready -U postgres >nul 2>&1
if !errorlevel! equ 0 (
    echo ✓ PostgreSQL database OK
) else (
    echo ✗ PostgreSQL database FAILED
    set /a failed_checks+=1
)

REM Check PostgREST API
call :check_service "PostgREST API" "http://localhost:%SUPABASE_API_PORT%"

REM Check Auth service
call :check_service "Auth Service" "http://localhost:%SUPABASE_AUTH_PORT%/health"

REM Check Studio
call :check_service "Supabase Studio" "http://localhost:%SUPABASE_STUDIO_PORT%"

REM Summary
echo.
if !failed_checks! equ 0 (
    echo 🎉 All Supabase services are healthy!
    echo.
    echo Service URLs:
    echo   📊 Supabase Studio: http://localhost:%SUPABASE_STUDIO_PORT%
    echo   🔌 PostgREST API: http://localhost:%SUPABASE_API_PORT%
    echo   🔐 Auth Service: http://localhost:%SUPABASE_AUTH_PORT%
    echo   🗄️  PostgreSQL: localhost:%SUPABASE_DB_PORT%
    exit /b 0
) else (
    echo ❌ !failed_checks! service(s) failed health check
    echo.
    echo Troubleshooting tips:
    echo   1. Make sure Docker Compose is running: docker-compose ps
    echo   2. Check service logs: docker-compose logs [service-name]
    echo   3. Restart services: docker-compose restart
    exit /b 1
)