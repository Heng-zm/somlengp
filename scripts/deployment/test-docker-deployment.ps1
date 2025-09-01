# Test Docker Deployment Script
# This script tests the Docker-based deployment configuration locally

param(
    [Parameter()]
    [string]$Environment = "production",
    
    [Parameter()]
    [switch]$SkipBuild,
    
    [Parameter()]
    [switch]$RunTests,
    
    [Parameter()]
    [string]$Port = "3000"
)

Write-Host "🚀 Testing Docker Deployment Configuration" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Port: $Port" -ForegroundColor Yellow

# Check if Docker is running
Write-Host "⚙️  Checking Docker status..." -ForegroundColor Blue
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host "📝 Please update .env.local with your actual environment variables" -ForegroundColor Yellow
}

# Build the Docker image (unless skipped)
if (-not $SkipBuild) {
    Write-Host "🔨 Building Docker image..." -ForegroundColor Blue
    docker build -t somlengp:test . --build-arg NODE_ENV=$Environment
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Docker image built successfully" -ForegroundColor Green
}

# Stop any existing container
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Blue
docker stop somlengp-test 2>$null
docker rm somlengp-test 2>$null

# Run the container
Write-Host "🚀 Starting Docker container..." -ForegroundColor Blue
docker run -d --name somlengp-test --env-file .env.local -p "$($Port):3000" somlengp:test

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Docker container" -ForegroundColor Red
    exit 1
}

# Wait for the application to start
Write-Host "⏳ Waiting for application to start..." -ForegroundColor Blue
$retries = 0
$maxRetries = 30

do {
    Start-Sleep 2
    $retries++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Application is running at http://localhost:$Port" -ForegroundColor Green
            break
        }
    }
    catch {
        if ($retries -eq $maxRetries) {
            Write-Host "❌ Application failed to start within expected time" -ForegroundColor Red
            Write-Host "📋 Container logs:" -ForegroundColor Yellow
            docker logs somlengp-test
            exit 1
        }
    }
} while ($retries -lt $maxRetries)

# Run tests if requested
if ($RunTests) {
    Write-Host "🧪 Running health checks..." -ForegroundColor Blue
    
    # Test main page
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Main page loads successfully" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "❌ Main page failed to load" -ForegroundColor Red
    }
    
    # Test API endpoint (if exists)
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/api/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Health endpoint responds correctly" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠️  Health endpoint not available (this might be expected)" -ForegroundColor Yellow
    }
    
    # Run Lighthouse performance test
    Write-Host "🔍 Running Lighthouse performance test..." -ForegroundColor Blue
    try {
        npm run lighthouse 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Lighthouse tests passed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Lighthouse tests had issues" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "⚠️  Could not run Lighthouse tests" -ForegroundColor Yellow
    }
}

Write-Host "" -ForegroundColor White
Write-Host "🎉 Docker deployment test completed!" -ForegroundColor Green
Write-Host "📊 Application is running at: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "📋 View logs with: docker logs somlengp-test" -ForegroundColor Cyan
Write-Host "🛑 Stop with: docker stop somlengp-test" -ForegroundColor Cyan
Write-Host "🗑️  Clean up with: docker rm somlengp-test" -ForegroundColor Cyan

# Show container info
Write-Host "" -ForegroundColor White
Write-Host "📈 Container Information:" -ForegroundColor Blue
docker stats somlengp-test --no-stream

Write-Host "" -ForegroundColor White
Write-Host "💡 To test other deployment configurations:" -ForegroundColor Yellow
Write-Host "   - Netlify: Run './test-netlify-deployment.ps1'" -ForegroundColor White
Write-Host "   - Firebase: Run './test-firebase-deployment.ps1'" -ForegroundColor White
Write-Host "   - All configs: Run './test-all-deployments.ps1'" -ForegroundColor White
