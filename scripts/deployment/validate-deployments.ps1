# Simple Deployment Validation Script
# Tests all deployment configurations without special characters

param(
    [switch]$Verbose
)

Write-Host "=== Deployment Configuration Validation ===" -ForegroundColor Green
Write-Host "Checking all deployment configurations..." -ForegroundColor Yellow

$results = @()
$allPassed = $true

# Test 1: Configuration Files
Write-Host "`n1. Validating Configuration Files..." -ForegroundColor Blue
$configTests = @{
    "vercel.json" = $false
    "netlify.toml" = $false
    "apphosting.yaml" = $false
    "Dockerfile" = $false
    "docker-compose.yml" = $false
}

foreach ($file in $configTests.Keys) {
    if (Test-Path $file) {
        $configTests[$file] = $true
        Write-Host "   [PASS] $file found" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] $file not found" -ForegroundColor Red
        $allPassed = $false
    }
}

# Test 2: Vercel JSON Validation
Write-Host "`n2. Validating Vercel Configuration..." -ForegroundColor Blue
try {
    $vercelConfig = Get-Content "vercel.json" | ConvertFrom-Json
    Write-Host "   [PASS] vercel.json is valid JSON" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] vercel.json is invalid JSON" -ForegroundColor Red
    $allPassed = $false
}

# Test 3: Build Test
Write-Host "`n3. Testing Build Process..." -ForegroundColor Blue
if (Test-Path ".next/standalone") {
    Write-Host "   [PASS] Standalone build output exists" -ForegroundColor Green
} else {
    Write-Host "   [INFO] Running build to generate standalone output..." -ForegroundColor Yellow
    npm run build >$null 2>&1
    if ($LASTEXITCODE -eq 0 -and (Test-Path ".next/standalone")) {
        Write-Host "   [PASS] Build successful, standalone output generated" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Build failed or standalone output not generated" -ForegroundColor Red
        $allPassed = $false
    }
}

# Test 4: Environment Variables
Write-Host "`n4. Checking Environment Configuration..." -ForegroundColor Blue
if (Test-Path ".env.example") {
    Write-Host "   [PASS] .env.example template found" -ForegroundColor Green
} else {
    Write-Host "   [WARN] .env.example not found" -ForegroundColor Yellow
}

if (Test-Path ".env.local") {
    Write-Host "   [PASS] .env.local configuration found" -ForegroundColor Green
} else {
    Write-Host "   [INFO] .env.local not found (will be created from template if needed)" -ForegroundColor Yellow
}

# Test 5: Package.json Scripts
Write-Host "`n5. Validating Package Scripts..." -ForegroundColor Blue
try {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $requiredScripts = @("build", "start", "dev", "lighthouse")
    
    foreach ($script in $requiredScripts) {
        if ($packageJson.scripts.$script) {
            Write-Host "   [PASS] Script '$script' found" -ForegroundColor Green
        } else {
            Write-Host "   [WARN] Script '$script' not found" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   [FAIL] Could not read package.json" -ForegroundColor Red
    $allPassed = $false
}

# Test 6: Alternative Firebase Configs
Write-Host "`n6. Checking Alternative Firebase Configurations..." -ForegroundColor Blue
$firebaseConfigs = @("apphosting.dev.yaml", "apphosting.high-traffic.yaml")
foreach ($config in $firebaseConfigs) {
    if (Test-Path $config) {
        Write-Host "   [PASS] Alternative config $config found" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Alternative config $config not found" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "ALL CRITICAL TESTS PASSED" -ForegroundColor Green
    Write-Host "Your deployment configurations are ready!" -ForegroundColor Green
    
    Write-Host "`nAvailable deployment options:" -ForegroundColor Yellow
    Write-Host "  1. Vercel (current): vercel --prod" -ForegroundColor White
    Write-Host "  2. Docker: docker-compose up" -ForegroundColor White
    Write-Host "  3. Firebase App Hosting: firebase deploy" -ForegroundColor White
    Write-Host "  4. Netlify: Connect repo to Netlify dashboard" -ForegroundColor White
    
} else {
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "Please review the failed items above before deploying." -ForegroundColor Red
}

Write-Host "`nDeployment validation completed." -ForegroundColor Cyan

return $allPassed
