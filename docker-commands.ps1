#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Docker command helper for Box-Games
    
.DESCRIPTION
    Provides convenient shortcuts for common Docker commands
    
.EXAMPLE
    .\docker-commands.ps1 start
    .\docker-commands.ps1 logs-frontend
    .\docker-commands.ps1 reset
#>

param(
    [Parameter(Position = 0)]
    [string]$Command = ""
)

function Show-Help {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "   Box-Games Docker Command Helper" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\docker-commands.ps1 [command]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Green
    Write-Host "  build              Build images (fresh)"
    Write-Host "  build-nocache      Build without cache"
    Write-Host "  start              Start containers (foreground)"
    Write-Host "  start-bg           Start containers in background"
    Write-Host "  stop               Stop containers"
    Write-Host "  logs               View all logs"
    Write-Host "  logs-frontend      View frontend logs only"
    Write-Host "  logs-backend       View backend logs only"
    Write-Host "  status             Check container status"
    Write-Host "  clean              Stop and remove all"
    Write-Host "  reset              Clean build and start fresh"
    Write-Host "  test               Test connections"
    Write-Host ""
}

function Test-DockerInstalled {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $docker) {
        Write-Host "ERROR: Docker is not installed or not in PATH" -ForegroundColor Red
        exit 1
    }
}

function Test-InProjectRoot {
    if (-not (Test-Path "docker-compose.yml")) {
        Write-Host "ERROR: docker-compose.yml not found. Run from project root." -ForegroundColor Red
        exit 1
    }
}

# Main command handling
Test-DockerInstalled
Test-InProjectRoot

switch ($Command.ToLower()) {
    "" {
        Show-Help
    }
    
    "build" {
        Write-Host "Building Docker images..." -ForegroundColor Yellow
        docker compose build
    }
    
    "build-nocache" {
        Write-Host "Building Docker images without cache..." -ForegroundColor Yellow
        docker compose build --no-cache
    }
    
    "start" {
        Write-Host "Starting containers (Ctrl+C to stop)..." -ForegroundColor Yellow
        docker compose up
    }
    
    "start-bg" {
        Write-Host "Starting containers in background..." -ForegroundColor Yellow
        docker compose up -d
        Write-Host ""
        Write-Host "✓ Containers are starting." -ForegroundColor Green
        Write-Host "Check status with: docker compose ps" -ForegroundColor Cyan
    }
    
    "stop" {
        Write-Host "Stopping containers..." -ForegroundColor Yellow
        docker compose stop
        Write-Host "✓ Containers stopped." -ForegroundColor Green
    }
    
    "logs" {
        Write-Host "Showing all logs (Ctrl+C to exit)..." -ForegroundColor Yellow
        docker compose logs -f
    }
    
    "logs-frontend" {
        Write-Host "Showing frontend logs (Ctrl+C to exit)..." -ForegroundColor Yellow
        docker compose logs -f frontend
    }
    
    "logs-backend" {
        Write-Host "Showing backend logs (Ctrl+C to exit)..." -ForegroundColor Yellow
        docker compose logs -f backend
    }
    
    "status" {
        Write-Host "Checking container status..." -ForegroundColor Yellow
        docker compose ps
    }
    
    "clean" {
        Write-Host "Stopping and removing containers..." -ForegroundColor Yellow
        docker compose down
        Write-Host "✓ Cleaned up." -ForegroundColor Green
    }
    
    "reset" {
        Write-Host "Performing full reset..." -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "Step 1: Removing containers..." -ForegroundColor Cyan
        docker compose down
        
        Write-Host "Step 2: Pruning system..." -ForegroundColor Cyan
        docker system prune -f
        
        Write-Host "Step 3: Building fresh images..." -ForegroundColor Cyan
        docker compose build --no-cache
        
        Write-Host "Step 4: Starting services..." -ForegroundColor Cyan
        docker compose up
    }
    
    "test" {
        Write-Host "Testing connections..." -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "Testing Frontend (http://localhost:3000)..." -ForegroundColor Cyan
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue -TimeoutSec 2
            Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "✗ Not responding" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "Testing Backend (http://localhost:8000)..." -ForegroundColor Cyan
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000" -ErrorAction SilentlyContinue -TimeoutSec 2
            Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "✗ Not responding" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "Testing Health Endpoint (http://localhost:8000/health)..." -ForegroundColor Cyan
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -ErrorAction SilentlyContinue -TimeoutSec 2
            Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "✗ Not responding" -ForegroundColor Red
        }
    }
    
    default {
        Write-Host "ERROR: Unknown command: $Command" -ForegroundColor Red
        Write-Host "Run without arguments for help" -ForegroundColor Yellow
        exit 1
    }
}
