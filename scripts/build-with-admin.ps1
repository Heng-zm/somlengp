# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))
{
    Write-Host "This script requires Administrator privileges. Please run PowerShell as Administrator." -ForegroundColor Red
    exit 1
}

# Enable Developer Mode
Write-Host "Enabling Developer Mode..." -ForegroundColor Green
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /v AllowDevelopmentWithoutDevLicense /t REG_DWORD /d 1 /f

# Give user symlink creation privilege
Write-Host "Granting symlink creation privilege..." -ForegroundColor Green
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
secedit /export /cfg temp_security.inf
$content = Get-Content temp_security.inf
$content = $content -replace "(SeCreateSymbolicLinkPrivilege = .*)", "`$1,$currentUser"
$content | Set-Content temp_security.inf
secedit /configure /db temp_security.sdb /cfg temp_security.inf
Remove-Item temp_security.inf, temp_security.sdb -Force -ErrorAction SilentlyContinue

Write-Host "Privileges updated. Please restart your PowerShell session and try running 'vercel build' again." -ForegroundColor Yellow
