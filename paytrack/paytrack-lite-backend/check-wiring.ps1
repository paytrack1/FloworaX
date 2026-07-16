Write-Host "=== sales.js route (looking for requireFeature) ===" -ForegroundColor Cyan
Get-Content "C:\Users\Peter\Desktop\Paytrack lite\paytrack\paytrack-lite-backend\src\routes\sales.js" -ErrorAction SilentlyContinue

Write-Host "`n=== bookings.js route (looking for requireFeature) ===" -ForegroundColor Cyan
Get-Content "C:\Users\Peter\Desktop\Paytrack lite\paytrack\paytrack-lite-backend\src\routes\bookings.js" -ErrorAction SilentlyContinue

Write-Host "`n=== grep requireFeature usage across all routes ===" -ForegroundColor Cyan
Get-ChildItem -Path "C:\Users\Peter\Desktop\Paytrack lite\paytrack\paytrack-lite-backend\src\routes" -Include *.js -Recurse |
    Select-String -Pattern "requireFeature" |
    Format-Table Path, LineNumber, Line -AutoSize