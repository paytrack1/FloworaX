Write-Host "=== BACKEND: plan.js full content ===" -ForegroundColor Cyan
Get-Content "C:\Users\Peter\Desktop\Paytrack lite\paytrack\paytrack-lite-backend\src\middleware\plan.js"

Write-Host "`n=== BACKEND: all matches for monthlySales / monthlyBookings / sales / bookings (as limit keys) ===" -ForegroundColor Cyan
Get-ChildItem -Path "C:\Users\Peter\Desktop\Paytrack lite\paytrack\paytrack-lite-backend" -Recurse -Include *.js -Exclude node_modules |
    Select-String -Pattern "monthlySales|monthlyBookings" |
    Format-Table Path, LineNumber, Line -AutoSize

Write-Host "`n=== FRONTEND: all matches for monthlySales / monthlyBookings ===" -ForegroundColor Cyan
Get-ChildItem -Path "C:\Users\Peter\Desktop\Paytrack lite\paytrack" -Recurse -Include *.js,*.jsx,*.ts,*.tsx -Exclude node_modules |
    Select-String -Pattern "monthlySales|monthlyBookings" |
    Format-Table Path, LineNumber, Line -AutoSize