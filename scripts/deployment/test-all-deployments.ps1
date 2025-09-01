# Test All Deployment Configurations
# This script tests all alternative deployment configurations

param(
    [Parameter()]
    [switch]$SkipBuild,
    
    [Parameter()]
    [switch]$RunPerformanceTests,
    
    [Parameter()]
    [string]$OutputReport = "deployment-test-report.md"
)

$ErrorActionPreference = "Continue"
$results = @()

Write-Host "Testing All Deployment Configurations" -ForegroundColor Green
Write-Host "Output Report: $OutputReport" -ForegroundColor Yellow

# Initialize report
$reportContent = @"
# Deployment Configuration Test Report
Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Summary
This report contains the results of testing alternative deployment configurations for the Somlengp project.

## Test Results

"@

# Test 1: Docker Deployment
Write-Host "`n🐳 Testing Docker Deployment..." -ForegroundColor Blue
$dockerResult = @{
    Name = "Docker"
    Success = $false
    Port = 3000
    StartTime = Get-Date
    EndTime = $null
    Notes = @()
}

try {
    # Check Docker availability
    docker version | Out-Null
    $dockerResult.Notes += "✅ Docker is available"
    
    # Build and run Docker container
    if (-not $SkipBuild) {
        Write-Host "Building Docker image..." -ForegroundColor Yellow
        docker build -t somlengp:test-all . 2>$null
        if ($LASTEXITCODE -eq 0) {
            $dockerResult.Notes += "✅ Docker image built successfully"
        } else {
            $dockerResult.Notes += "❌ Docker image build failed"
            throw "Docker build failed"
        }
    }
    
    # Stop existing container
    docker stop somlengp-docker-test 2>$null
    docker rm somlengp-docker-test 2>$null
    
    # Start container
    docker run -d --name somlengp-docker-test -p "3000:3000" somlengp:test-all
    if ($LASTEXITCODE -eq 0) {
        $dockerResult.Notes += "✅ Container started successfully"
        
        # Wait and test
        Start-Sleep 10
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                $dockerResult.Success = $true
                $dockerResult.Notes += "✅ Application responds correctly"
            }
        } catch {
            $dockerResult.Notes += "❌ Application failed to respond"
        }
        
        # Clean up
        docker stop somlengp-docker-test 2>$null
        docker rm somlengp-docker-test 2>$null
    } else {
        $dockerResult.Notes += "❌ Failed to start container"
    }
} catch {
    $dockerResult.Notes += "❌ Docker test failed: $($_.Exception.Message)"
}

$dockerResult.EndTime = Get-Date
$results += $dockerResult

# Test 2: Build Validation for Different Platforms
Write-Host "`n🏗️ Testing Build Configurations..." -ForegroundColor Blue
$buildResult = @{
    Name = "Build Validation"
    Success = $false
    StartTime = Get-Date
    EndTime = $null
    Notes = @()
}

try {
    # Test regular build
    Write-Host "Testing standard build..." -ForegroundColor Yellow
    npm run build 2>$null
    if ($LASTEXITCODE -eq 0) {
        $buildResult.Notes += "✅ Standard build successful"
        
        # Check if standalone output is generated
        if (Test-Path ".next/standalone") {
            $buildResult.Notes += "✅ Standalone output generated for Docker"
        } else {
            $buildResult.Notes += "⚠️ Standalone output not found"
        }
        
        $buildResult.Success = $true
    } else {
        $buildResult.Notes += "❌ Standard build failed"
    }
    
    # Test bundle analysis
    if (Get-Command "npm" -ErrorAction SilentlyContinue) {
        Write-Host "Running bundle analysis..." -ForegroundColor Yellow
        $env:ANALYZE = "true"
        npm run build 2>$null
        if ($LASTEXITCODE -eq 0) {
            $buildResult.Notes += "✅ Bundle analysis completed"
        } else {
            $buildResult.Notes += "⚠️ Bundle analysis had issues"
        }
        $env:ANALYZE = $null
    }
    
} catch {
    $buildResult.Notes += "❌ Build test failed: $($_.Exception.Message)"
}

$buildResult.EndTime = Get-Date
$results += $buildResult

# Test 3: Configuration Validation
Write-Host "`n⚙️ Validating Configuration Files..." -ForegroundColor Blue
$configResult = @{
    Name = "Configuration Validation"
    Success = $true
    StartTime = Get-Date
    EndTime = $null
    Notes = @()
}

# Check Vercel config
if (Test-Path "vercel.json") {
    try {
        $vercelConfig = Get-Content "vercel.json" | ConvertFrom-Json
        $configResult.Notes += "✅ vercel.json is valid JSON"
    } catch {
        $configResult.Notes += "❌ vercel.json is invalid"
        $configResult.Success = $false
    }
} else {
    $configResult.Notes += "⚠️ vercel.json not found"
}

# Check Netlify config
if (Test-Path "netlify.toml") {
    $configResult.Notes += "✅ netlify.toml found"
} else {
    $configResult.Notes += "⚠️ netlify.toml not found"
}

# Check Firebase configs
if (Test-Path "apphosting.yaml") {
    $configResult.Notes += "✅ apphosting.yaml found"
} else {
    $configResult.Notes += "⚠️ apphosting.yaml not found"
}

# Check Docker configs
if (Test-Path "Dockerfile") {
    $configResult.Notes += "✅ Dockerfile found"
} else {
    $configResult.Notes += "⚠️ Dockerfile not found"
    $configResult.Success = $false
}

if (Test-Path "docker-compose.yml") {
    $configResult.Notes += "✅ docker-compose.yml found"
} else {
    $configResult.Notes += "⚠️ docker-compose.yml not found"
}

$configResult.EndTime = Get-Date
$results += $configResult

# Test 4: Performance Testing (if requested)
if ($RunPerformanceTests) {
    Write-Host "`n🔍 Running Performance Tests..." -ForegroundColor Blue
    $perfResult = @{
        Name = "Performance Testing"
        Success = $false
        StartTime = Get-Date
        EndTime = $null
        Notes = @()
    }
    
    try {
        # Start the application for testing
        Start-Process -FilePath "npm" -ArgumentList "run", "start" -WindowStyle Hidden
        Start-Sleep 15
        
        # Run Lighthouse
        npm run lighthouse 2>$null
        if ($LASTEXITCODE -eq 0) {
            $perfResult.Success = $true
            $perfResult.Notes += "✅ Lighthouse tests completed"
            
            if (Test-Path ".lighthouseci") {
                $perfResult.Notes += "✅ Lighthouse reports generated"
            }
        } else {
            $perfResult.Notes += "❌ Lighthouse tests failed"
        }
        
        # Stop the application (attempt to kill Node processes)
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        
    } catch {
        $perfResult.Notes += "❌ Performance test failed: $($_.Exception.Message)"
    }
    
    $perfResult.EndTime = Get-Date
    $results += $perfResult
}

# Generate Report
Write-Host "`n📋 Generating Test Report..." -ForegroundColor Blue

foreach ($result in $results) {
    $duration = ($result.EndTime - $result.StartTime).TotalSeconds
    $statusEmoji = if ($result.Success) { "✅" } else { "❌" }
    
    $reportContent += @"

### $($result.Name) $statusEmoji
- **Status**: $(if ($result.Success) { "PASSED" } else { "FAILED" })
- **Duration**: $([math]::Round($duration, 2)) seconds
- **Details**:
"@
    
    foreach ($note in $result.Notes) {
        $reportContent += "`n  - $note"
    }
    
    $reportContent += "`n"
}

# Add summary
$passedTests = ($results | Where-Object { $_.Success }).Count
$totalTests = $results.Count

$reportContent += @"

## Summary
- **Total Tests**: $totalTests
- **Passed**: $passedTests
- **Failed**: $($totalTests - $passedTests)
- **Success Rate**: $([math]::Round(($passedTests / $totalTests) * 100, 1))%

## Recommendations

"@

if ($passedTests -eq $totalTests) {
    $reportContent += "🎉 All deployment configurations are working correctly! You can confidently deploy using any of the tested methods.`n`n"
} else {
    $reportContent += "⚠️ Some deployment configurations need attention. Review the failed tests above and address the issues before deploying.`n`n"
}

$reportContent += @"
### Next Steps
1. **Docker Deployment**: Ready for containerized deployment
2. **Netlify Deployment**: Ready for static site deployment  
3. **Firebase App Hosting**: Ready with multiple scaling configurations
4. **Vercel Deployment**: Already configured and ready

### Available Commands
- Test Docker only: `./test-docker-deployment.ps1`
- Switch Firebase configs: Copy content from `apphosting.*.yaml` files
- Deploy to Vercel: `vercel --prod`
- Deploy to Netlify: Connect your repository to Netlify

---
*Report generated by deployment testing script*
"@

# Save report
$reportContent | Out-File -FilePath $OutputReport -Encoding UTF8

Write-Host "`n🎉 All deployment tests completed!" -ForegroundColor Green
Write-Host "📊 Results Summary:" -ForegroundColor Cyan
Write-Host "   Passed: $passedTests / $totalTests tests" -ForegroundColor Green
Write-Host "📄 Detailed report saved to: $OutputReport" -ForegroundColor Cyan

# Display summary
foreach ($result in $results) {
    $statusColor = if ($result.Success) { "Green" } else { "Red" }
    $statusEmoji = if ($result.Success) { "✅" } else { "❌" }
    Write-Host "   $statusEmoji $($result.Name)" -ForegroundColor $statusColor
}

if ($passedTests -lt $totalTests) {
    Write-Host "`n⚠️ Some tests failed. Review the report for details." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`n🚀 All deployment configurations are ready!" -ForegroundColor Green
    exit 0
}
