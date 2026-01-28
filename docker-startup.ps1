#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Box-Games Docker startup with debug info
    
.DESCRIPTION
    Starts Docker containers and monitors backend health
#>

param(
    [Parameter(Position = 0)]
    [ValidateSet('build', 'start', 'start-debug', 'logs', 'stop', 'clean', 'reset')]
    [string]$Command = 'start'
)

Set-Location (Split-Path -Parent $PSScriptRoot)

function Build-Images {
    Write-Host "🔨 Building Docker images..." -ForegroundColor Cyan
    docker compose build --no-cache
    Write-Host "✓ Build complete" -ForegroundColor Green
}

function Start-Services {
    Write-Host "🚀 Starting services..." -ForegroundColor Cyan
    docker compose up -d
    
    Write-Host ""
    Write-Host "⏳ Waiting for backend to be healthy..." -ForegroundColor Yellow
    
    $maxWait = 60
    $elapsed = 0
    
    while ($elapsed -lt $maxWait) {
        $status = docker compose ps --format "table {{.Names}}\t{{.Status}}" | Select-String "app-backend"
        
        if ($status -match "healthy") {
            Write-Host "✓ Backend is healthy!" -ForegroundColor Green
            break
        }
        
        if ($status -match "unhealthy") {
            Write-Host "✗ Backend health check failed" -ForegroundColor Red
            Write-Host ""
            Write-Host "📋 Backend logs:" -ForegroundColor Yellow
            docker compose logs backend | Select-Object -Last 20
            exit 1
        }
        
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "  Checking... ($elapsed/$maxWait seconds)" -ForegroundColor Gray
    }
    
    if ($elapsed -ge $maxWait) {
        Write-Host "⚠ Timeout waiting for backend health check" -ForegroundColor Red
        docker compose ps
        exit 1
    }
    
    Write-Host ""
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    docker compose ps --format "table {{.Names}}\t{{.Status}}"
    
    Write-Host ""
    Write-Host "✅ Services ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access Points:" -ForegroundColor Yellow
    Write-Host "  Frontend: http://localhost:3000"
    Write-Host "  Backend:  http://localhost:8000"
    Write-Host "  Health:   http://localhost:8000/health"
}

function Start-Debug {
    Write-Host "🐛 Starting services in debug mode..." -ForegroundColor Cyan
    docker compose up
}

function Show-Logs {
    Write-Host "📋 Backend logs (Ctrl+C to exit):" -ForegroundColor Yellow
    docker compose logs -f backend
}

function Stop-Services {
    Write-Host "🛑 Stopping services..." -ForegroundColor Yellow
    docker compose stop
    Write-Host "✓ Services stopped" -ForegroundColor Green
}

function Clean-Everything {
    Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
    docker compose down
    Write-Host "✓ Cleanup complete" -ForegroundColor Green
}

function Reset-All {
    Write-Host "🔄 Full reset..." -ForegroundColor Yellow
    
    Write-Host "  Removing containers..." -ForegroundColor Gray
    docker compose down
    
    Write-Host "  Pruning Docker system..." -ForegroundColor Gray
    docker system prune -f
    
    Write-Host "  Building fresh..." -ForegroundColor Gray
    docker compose build --no-cache
    
    Write-Host "  Starting services..." -ForegroundColor Gray
    Start-Services
}

# Main execution
switch ($Command) {
    'build' { Build-Images }
    'start' { Start-Services }
    'start-debug' { Start-Debug }
    'logs' { Show-Logs }
    'stop' { Stop-Services }
    'clean' { Clean-Everything }
    'reset' { Reset-All }
}
