# Post-build script to fix Windows symlink issues for Vercel deployment
Write-Host "Fixing symlink issues in Vercel build output..." -ForegroundColor Green

$functionsDir = ".vercel\output\functions\api"

if (Test-Path $functionsDir) {
    Write-Host "Found functions directory: $functionsDir" -ForegroundColor Yellow
    
    # Get all .func directories
    $funcDirs = Get-ChildItem -Path $functionsDir -Directory -Filter "*.func"
    
    if ($funcDirs.Count -eq 0) {
        Write-Host "No .func directories found. Build may not have completed successfully." -ForegroundColor Red
        exit 1
    }
    
    # Find the base function directory (usually the first one created)
    $baseFunc = $funcDirs | Sort-Object LastWriteTime | Select-Object -First 1
    Write-Host "Using base function: $($baseFunc.Name)" -ForegroundColor Yellow
    
    # Copy the base function to all other function directories that don't exist or are incomplete
    foreach ($targetName in @("analytics.func", "analytics\insights.func", "debug.func", "debug\comments.func", "feedback.func", "health.func", "otp\resend.func", "otp\send.func", "otp\verify.func", "test.func", "visit.func")) {
        $targetPath = Join-Path $functionsDir $targetName
        $targetDir = Split-Path $targetPath -Parent
        
        # Create directory structure if needed
        if (!(Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        
        if (!(Test-Path $targetPath) -or (Get-ChildItem $targetPath -ErrorAction SilentlyContinue).Count -eq 0) {
            Write-Host "Copying $($baseFunc.Name) to $targetName..." -ForegroundColor Cyan
            Copy-Item -Path $baseFunc.FullName -Destination $targetPath -Recurse -Force
        }
    }
    
    Write-Host "Symlink fixes completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Functions directory not found. Please run 'vercel build' first." -ForegroundColor Red
    exit 1
}
